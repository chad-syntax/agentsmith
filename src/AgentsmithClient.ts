import fs from 'fs';
import path from 'path';
import { Database } from '@/app/__generated__/supabase.types';
import { createJwtClient } from '@/lib/supabase/server-api-key';
import { globalsJsonFilePath } from '@/lib/sync/repo-paths';
import { SdkExchangeResponse } from '@/types/api-responses';
import { routes } from '@/utils/routes';
import { SupabaseClient } from '@supabase/supabase-js';
import { GenericAgency, PromptIdentifier } from './types';
import { Prompt } from './Prompt';

const defaultAgentsmithDirectory = path.join(process.cwd(), 'agentsmith');

type AgentsmithClientOptions = {
  agentsmithApiRoot?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  agentsmithDirectory?: string;
};

export class AgentsmithClient<Agency extends GenericAgency> {
  public supabase!: SupabaseClient<Database>;
  public projectUuid: string;
  public agentsmithDirectory: string;

  private sdkApiKey: string;
  private fetchGlobalsPromise: Promise<Agency['globals']> | null = null;
  private projectGlobals: Agency['globals'] | null = null;
  private initializePromise: Promise<void>;
  private agentsmithApiRoot: string;
  private supabaseUrl: string;
  private supabaseAnonKey: string;

  constructor(sdkApiKey: string, projectId: string, options: AgentsmithClientOptions = {}) {
    this.sdkApiKey = sdkApiKey;
    this.projectUuid = projectId;
    this.agentsmithApiRoot = options.agentsmithApiRoot ?? process.env.NEXT_PUBLIC_SITE_URL!;
    this.supabaseUrl = options.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
    this.supabaseAnonKey = options.supabaseAnonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    this.agentsmithDirectory = options.agentsmithDirectory ?? defaultAgentsmithDirectory;

    this.initializePromise = this.initialize();
    this.initializeGlobals();
  }

  private async initialize() {
    const jwt = await this.exchangeApiKeyForJwt(this.sdkApiKey);

    this.supabase = createJwtClient(jwt, this.supabaseUrl, this.supabaseAnonKey);
  }

  private async exchangeApiKeyForJwt(sdkApiKey: string) {
    try {
      const response = await fetch(`${this.agentsmithApiRoot}${routes.api.v1.sdkExchange}`, {
        method: 'POST',
        body: JSON.stringify({ apiKey: sdkApiKey }),
      });
      const data = (await response.json()) as SdkExchangeResponse;
      return data.jwt;
    } catch (error) {
      throw new Error('Failed to exchange API key for JWT');
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
    // first try to fetch from the file system
    try {
      const globalsJsonPath = globalsJsonFilePath({
        agentsmithFolder: this.agentsmithDirectory,
      });

      const globalsJson = await fs.promises.readFile(globalsJsonPath, 'utf-8');

      this.projectGlobals = JSON.parse(globalsJson) as Agency['globals'];

      return this.projectGlobals;
    } catch (err) {
      // if the file system fetch fails, fetch from the database
      console.error('Failed to fetch globals from the file system', err);
    }

    try {
      const { data, error } = await this.supabase
        .from('global_contexts')
        .select('*, projects(uuid)')
        .eq('projects.uuid', this.projectUuid)
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
      this.fetchGlobalsPromise = null;
      throw err;
    }
  }
}
