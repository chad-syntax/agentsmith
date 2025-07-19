import fs from 'fs';
import path from 'path';
import PQueue, { Options as PQueueOptions } from 'p-queue';
import { Database } from '@/app/__generated__/supabase.types';
import { createJwtClient } from '@/lib/supabase/server-api-key';
import { globalsJsonFilePath } from '@/lib/sync/repo-paths';
import { SdkExchangeResponse } from '@/types/api-responses';
import { routes } from '@/utils/routes';
import { SupabaseClient } from '@supabase/supabase-js';
import { GenericAgency, PromptIdentifier, Logger, LogLevel } from './types';
import { Prompt } from './Prompt';

const defaultAgentsmithDirectory = path.join(process.cwd(), 'agentsmith');

export type FetchStrategy = 'fs-only' | 'remote-fallback' | 'remote-only' | 'fs-fallback';
type CompletionLogDirTransformer = (options: {
  logUuid: string;
  prompt: {
    name: string;
    slug: string;
    uuid: string;
  };
  promptVersion: {
    uuid: string;
    version: string;
    config: any;
    content: string;
  };
  variables: Record<string, any>;
  rawInput: any;
  rawOutput: any;
}) => string;

type AgentsmithClientOptions = {
  agentsmithApiRoot?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  agentsmithDirectory?: string;
  queueOptions?: PQueueOptions<any, any>;
  fetchStrategy?: FetchStrategy;
  logger?: Logger;
  logLevel?: LogLevel;
  completionLogsDirectory?: string;
  completionLogDirTransformer?: CompletionLogDirTransformer;
};

export class AgentsmithClient<Agency extends GenericAgency> {
  public supabase!: SupabaseClient<Database>;
  public projectUuid: string;
  public agentsmithDirectory: string;
  public queue: PQueue;
  public abortController: AbortController;
  public fetchStrategy: FetchStrategy;
  public logger: Logger;
  public completionLogsDirectory: string | null;
  public completionLogDirTransformer: CompletionLogDirTransformer | null;

  private sdkApiKey: string;
  private fetchGlobalsPromise: Promise<Agency['globals']> | null = null;
  private projectGlobals: Agency['globals'] | null = null;
  private initializePromise: Promise<void>;
  private agentsmithApiRoot: string;
  private supabaseUrl: string;
  private supabaseAnonKey: string;
  private refreshJwtTimeout: NodeJS.Timeout | null = null;
  private logLevel: LogLevel;

  constructor(sdkApiKey: string, projectId: string, options: AgentsmithClientOptions = {}) {
    this.sdkApiKey = sdkApiKey;
    this.projectUuid = projectId;
    this.agentsmithApiRoot = options.agentsmithApiRoot ?? process.env.NEXT_PUBLIC_SITE_URL!;
    this.supabaseUrl = options.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
    this.supabaseAnonKey = options.supabaseAnonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    this.agentsmithDirectory = options.agentsmithDirectory ?? defaultAgentsmithDirectory;
    this.fetchStrategy = options.fetchStrategy ?? 'remote-fallback';
    this.logLevel = options.logLevel ?? 'warn';
    this.logger = options.logger ?? this.createDefaultLogger(this.logLevel);
    this.completionLogsDirectory = options.completionLogsDirectory ?? null;
    this.completionLogDirTransformer = options.completionLogDirTransformer ?? null;

    this.queue = new PQueue({ ...options.queueOptions });

    if (!this.sdkApiKey || this.sdkApiKey === '') {
      throw new Error('Agentsmith SDK API key is required to initialize the agentsmith client');
    }

    if (!this.projectUuid || this.projectUuid === '') {
      throw new Error('Project UUID is required to initialize the agentsmith client');
    }

    if (!this.agentsmithApiRoot || this.agentsmithApiRoot === '') {
      throw new Error('Agentsmith API root is required to initialize the agentsmith client');
    }

    this.abortController = new AbortController();
    this.initializePromise = this.initialize();
    this.initializeGlobals().catch(() => {
      // This is to prevent unhandled promise rejections in tests
    });

    // Bind public methods to preserve 'this' context
    this.getPrompt = this.getPrompt.bind(this);
    this.initializeGlobals = this.initializeGlobals.bind(this);
    this.shutdown = this.shutdown.bind(this);
  }

  private createDefaultLogger(logLevel: LogLevel): Logger {
    const shouldLog = (level: LogLevel) => {
      if (logLevel === 'silent') return false;
      const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
      return levels.indexOf(level) >= levels.indexOf(logLevel);
    };

    const noOp = () => {};

    return {
      debug: shouldLog('debug') ? console.debug.bind(console) : noOp,
      info: shouldLog('info') ? console.info.bind(console) : noOp,
      warn: shouldLog('warn') ? console.warn.bind(console) : noOp,
      error: shouldLog('error') ? console.error.bind(console) : noOp,
    };
  }

  private async initialize() {
    try {
      const jwt = await this.exchangeApiKeyForJwt(this.sdkApiKey);
      if (this.abortController.signal.aborted) return;

      this.supabase = createJwtClient(jwt, this.supabaseUrl, this.supabaseAnonKey);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      this.logger.error('Failed to initialize the agentsmith client', error);
      throw error;
    }
  }

  private async exchangeApiKeyForJwt(sdkApiKey: string) {
    try {
      const response = await fetch(`${this.agentsmithApiRoot}${routes.api.v1.sdkExchange}`, {
        method: 'POST',
        body: JSON.stringify({ apiKey: sdkApiKey }),
        signal: this.abortController.signal,
      });
      const data = (await response.json()) as SdkExchangeResponse;
      if ('error' in data) {
        throw new Error(data.error);
      }

      const refreshJwtTimeout = (data.expiresAt - Date.now() / 1000 - 60) * 1000;

      this.refreshJwtTimeout = setTimeout(() => {
        this.initialize();
      }, refreshJwtTimeout);

      return data.jwt;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return '';
      throw new Error(
        `Failed to communicate with ${this.agentsmithApiRoot}${routes.api.v1.sdkExchange} to exchange API key for JWT: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  public async getPrompt<PromptArg extends PromptIdentifier<Agency>>(
    arg: PromptArg,
  ): Promise<Prompt<Agency, PromptArg>> {
    await this.initializePromise;

    const prompt = new Prompt<Agency, PromptArg>({
      arg,
      client: this,
    });
    await prompt.init();
    return prompt;
  }

  public async initializeGlobals(): Promise<Agency['globals']> {
    await this.initializePromise;
    if (this.abortController.signal.aborted) return {} as Agency['globals'];

    if (this.projectGlobals) {
      return this.projectGlobals;
    }

    if (this.fetchGlobalsPromise) {
      return this.fetchGlobalsPromise;
    }

    this.fetchGlobalsPromise = this.fetchGlobals();

    return this.fetchGlobalsPromise;
  }

  public async fetchGlobals(): Promise<Agency['globals']> {
    if (this.fetchStrategy === 'remote-only') {
      return this.fetchGlobalsFromRemote();
    }

    if (this.fetchStrategy === 'fs-only') {
      try {
        return await this.fetchGlobalsFromFileSystem();
      } catch (error) {
        this.logger.error('Failed to fetch globals from file system', error);
        throw new Error('Failed to fetch globals from file system (fs-only strategy)');
      }
    }

    if (this.fetchStrategy === 'fs-fallback') {
      try {
        return await this.fetchGlobalsFromRemote();
      } catch (error) {
        this.logger.warn('Failed to fetch globals from remote, falling back to file system');
        try {
          return await this.fetchGlobalsFromFileSystem();
        } catch (fsError) {
          this.logger.error(
            'Failed to fetch globals from file system after remote fallback',
            fsError,
          );
          throw new Error('Failed to fetch globals from both remote and file system');
        }
      }
    }

    // remote-fallback
    try {
      return await this.fetchGlobalsFromFileSystem();
    } catch (error) {
      this.logger.warn('Failed to fetch globals from file system, falling back to remote');
      return this.fetchGlobalsFromRemote();
    }
  }

  private async fetchGlobalsFromFileSystem(): Promise<Agency['globals']> {
    const globalsJsonPath = globalsJsonFilePath({
      agentsmithFolder: this.agentsmithDirectory,
    });

    const globalsJson = await fs.promises.readFile(globalsJsonPath, 'utf-8');

    this.projectGlobals = JSON.parse(globalsJson) as Agency['globals'];

    return this.projectGlobals;
  }

  private async fetchGlobalsFromRemote(): Promise<Agency['globals']> {
    try {
      const { data, error } = await this.supabase
        .from('global_contexts')
        .select('*, projects(uuid)')
        .eq('projects.uuid', this.projectUuid)
        .abortSignal(this.abortController.signal)
        .single();

      if (error) {
        this.fetchGlobalsPromise = null;
        throw error;
      }

      if (!data) {
        this.fetchGlobalsPromise = null;
        throw new Error('No global context found');
      }

      this.projectGlobals = data.content as Agency['globals'];

      return this.projectGlobals;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        this.fetchGlobalsPromise = null;
        return {} as Agency['globals'];
      }
      this.fetchGlobalsPromise = null;
      throw err;
    }
  }

  public async shutdown() {
    await this.queue.onIdle();
    if (this.refreshJwtTimeout) {
      clearTimeout(this.refreshJwtTimeout);
      this.refreshJwtTimeout = null;
    }
    if (this.supabase) {
      this.supabase.realtime.disconnect();
    }
    this.abortController.abort();
  }
}
