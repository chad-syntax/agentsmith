import fs from 'fs';
import type { AgentsmithClient } from './AgentsmithClient';
import { Database, Json } from '@/app/__generated__/supabase.types';
import {
  PromptJSONFileContent,
  PromptVersionFileJSONContent,
  PromptVariableFileJSONContent,
} from '@/lib/sync/repo-file-formats';
import {
  promptJsonFilePath,
  versionJsonFilePath,
  contentJ2FilePath,
  variablesJsonFilePath,
} from '@/lib/sync/repo-paths';
import { validateVariables, validateGlobalContext, compilePrompt } from '@/utils/template-utils';
import { compareSemanticVersions } from '@/utils/versioning';
import {
  GenericAgency,
  PromptIdentifier,
  GetPromptVariables,
  GetPromptConfig,
  GetPromptContent,
  ExecuteOptions,
  ExecuteImplementationResult,
  CompileOptions,
  CompileResult,
  CompileSignature,
  ExecuteSignature,
} from './types';
import {
  OPENROUTER_HEADERS,
  OpenrouterNonStreamingResponse,
  OpenrouterRequestBody,
} from '@/lib/openrouter';
import { OrganizationsService } from '@/lib/OrganizationsService';
import { LLMLogsService } from '@/lib/LLMLogsService';
import { VaultService } from '@/lib/VaultService';
import { ORGANIZATION_KEYS } from '@/app/constants';
import { routes } from '@/utils/routes';
import { OpenrouterStreamEvent, streamToIterator } from '@/utils/stream-to-iterator';
import merge from 'lodash.merge';

type PromptConstructorOptions<
  Agency extends GenericAgency,
  PromptArg extends PromptIdentifier<Agency>,
> = {
  arg: PromptArg;
  client: AgentsmithClient<Agency>;
};

export class Prompt<Agency extends GenericAgency, PromptArg extends PromptIdentifier<Agency>> {
  private client: AgentsmithClient<Agency>;
  private slug: string;
  private argVersion: string;
  public meta!: {
    uuid: string;
    name: string;
    slug: string;
  };
  public version!: {
    uuid: string;
    version: string;
    config: GetPromptConfig<Agency, PromptArg>;
    content: string;
  };
  public variables!: {
    uuid: string;
    name: string;
    type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
    required: boolean;
    default_value: string | null;
  }[];

  public execute: ExecuteSignature<Agency, PromptArg>;
  public compile: CompileSignature<Agency, PromptArg>;

  constructor(options: PromptConstructorOptions<Agency, PromptArg>) {
    const { arg, client } = options;
    this.client = client;

    const [slug, argVersion] = arg.split('@');

    this.slug = slug;
    this.argVersion = argVersion ?? 'latest';

    this.compile = this._compile.bind(this) as any;
    this.execute = this._execute.bind(this) as any;
    this.init = this.init.bind(this);
  }

  public async init() {
    if (this.client.abortController.signal.aborted) return;

    if (this.client.fetchStrategy === 'remote-only') {
      try {
        await this._initFromRemote();
        this.client.logger.info(
          `Successfully initialized ${this.slug}@${this.argVersion} from remote`,
        );
        return;
      } catch (err) {
        this.client.logger.error(`Failed to initialize prompt ${this.slug} from remote`, err);
        throw new Error(
          `Failed to initialize prompt ${this.slug} from remote (remote-only strategy)`,
        );
      }
    }

    if (this.client.fetchStrategy === 'fs-only') {
      try {
        await this._initFromFileSystem();
        this.client.logger.info(
          `Successfully initialized ${this.slug}@${this.argVersion} from file system`,
        );
        return;
      } catch (err) {
        this.client.logger.error(`Failed to initialize prompt ${this.slug} from file system`, err);
        throw new Error(
          `Failed to initialize prompt ${this.slug} from file system (fs-only strategy)`,
        );
      }
    }

    if (this.client.fetchStrategy === 'fs-fallback') {
      try {
        await this._initFromRemote();
        this.client.logger.info(
          `Successfully initialized ${this.slug}@${this.argVersion} from remote`,
        );
        return;
      } catch (err) {
        this.client.logger.warn(
          `Could not initialize ${this.slug}@${this.argVersion} from remote, falling back to filesystem.`,
          err,
        );
        try {
          await this._initFromFileSystem();
          this.client.logger.info(
            `Successfully initialized ${this.slug}@${this.argVersion} from file system`,
          );
          return;
        } catch (fsErr) {
          this.client.logger.error(
            `Could not initialize ${this.slug}@${this.argVersion} from filesystem after remote fallback.`,
            fsErr,
          );
          throw new Error('Failed to initialize prompt from both remote and file system');
        }
      }
    }

    // remote-fallback
    try {
      await this._initFromFileSystem();
      this.client.logger.info(
        `Successfully initialized ${this.slug}@${this.argVersion} from file system`,
      );
    } catch (err) {
      this.client.logger.warn(
        `Could not initialize ${this.slug}@${this.argVersion} from filesystem, falling back to remote.`,
      );
      await this._initFromRemote();
      this.client.logger.info(
        `Successfully initialized ${this.slug}@${this.argVersion} from remote`,
      );
    }
  }

  private async _initFromFileSystem() {
    const promptJsonPath = promptJsonFilePath({
      agentsmithFolder: this.client.agentsmithDirectory,
      promptSlug: this.slug,
    });

    const promptJson = await fs.promises.readFile(promptJsonPath, 'utf-8');

    const prompt = JSON.parse(promptJson) as PromptJSONFileContent;

    this.meta = {
      uuid: prompt.uuid,
      name: prompt.name,
      slug: prompt.slug,
    };

    if (this.argVersion === 'latest' && prompt.latestVersion === null) {
      throw new Error(
        `No published version found for prompt ${this.slug} while trying to fetch latest version from file system, either publish a version or use a specific version number to use the draft.`,
      );
    }

    const targetVersion =
      this.argVersion === 'latest' && prompt.latestVersion !== null
        ? prompt.latestVersion
        : this.argVersion;

    const versionJsonPath = versionJsonFilePath({
      agentsmithFolder: this.client.agentsmithDirectory,
      promptSlug: this.slug,
      version: targetVersion,
    });

    const versionJsonFileContent = await fs.promises.readFile(versionJsonPath, 'utf-8');
    const versionJson = JSON.parse(versionJsonFileContent) as PromptVersionFileJSONContent;

    const contentJ2Path = contentJ2FilePath({
      agentsmithFolder: this.client.agentsmithDirectory,
      promptSlug: this.slug,
      version: targetVersion,
    });

    const contentJ2FileContent = await fs.promises.readFile(contentJ2Path, 'utf-8');

    this.version = {
      uuid: versionJson.uuid,
      version: versionJson.version,
      config: versionJson.config as GetPromptConfig<Agency, PromptArg>,
      content: contentJ2FileContent,
    };

    const variablesJsonPath = variablesJsonFilePath({
      agentsmithFolder: this.client.agentsmithDirectory,
      promptSlug: this.slug,
      version: targetVersion,
    });

    try {
      const variablesJsonFileContent = await fs.promises.readFile(variablesJsonPath, 'utf-8');

      const variablesJson = JSON.parse(variablesJsonFileContent) as PromptVariableFileJSONContent;

      this.variables = variablesJson.map((variable) => ({
        uuid: variable.uuid,
        name: variable.name,
        type: variable.type,
        required: variable.required,
        default_value: variable.default_value,
      }));
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        this.variables = [];
      } else {
        throw err;
      }
    }
  }

  private async _initFromRemote() {
    if (this.client.abortController.signal.aborted) return;

    const fetchSpecificVersion = this.argVersion && this.argVersion !== 'latest';

    if (fetchSpecificVersion) {
      const { data, error } = await this.client.supabase
        .from('prompt_versions')
        .select(
          'uuid, version, config, content, prompt_variables(uuid, name, type, required, default_value), prompts!inner(uuid, name, slug)',
        )
        .eq('prompts.slug', this.slug)
        .eq('version', this.argVersion)
        .abortSignal(this.client.abortController.signal)
        .single();

      if (error) {
        if (error.name === 'AbortError') return;
        throw error;
      }

      if (!data) {
        throw new Error(`Prompt version ${this.slug}@${this.argVersion} not found in remote.`);
      }

      const { prompts, prompt_variables, ...version } = data;

      this.meta = prompts;
      this.version = {
        ...version,
        config: version.config as GetPromptConfig<Agency, PromptArg>,
        content: version.content as GetPromptContent<Agency, PromptArg>,
      };
      this.variables = prompt_variables;

      return;
    }

    const { data, error } = await this.client.supabase
      .from('prompt_versions')
      .select(
        'uuid, version, config, content, prompt_variables(uuid, name, type, required, default_value), prompts!inner(uuid, name, slug)',
      )
      .eq('prompts.slug', this.slug)
      .eq('status', 'PUBLISHED')
      .abortSignal(this.client.abortController.signal);

    if (error) {
      if (error.name === 'AbortError') return;
      throw error;
    }

    const latestVersion = data.sort((a, b) => compareSemanticVersions(b.version, a.version))[0];

    if (!latestVersion) {
      throw new Error(
        `No published version found for prompt ${this.slug}@${this.argVersion} while trying to fetch latest version, either publish a version or use a specific version number to use the draft.`,
      );
    }

    const { prompts, prompt_variables, ...version } = latestVersion;

    this.meta = prompts;
    this.version = {
      ...version,
      config: version.config as GetPromptConfig<Agency, PromptArg>,
      content: version.content as GetPromptContent<Agency, PromptArg>,
    };
    this.variables = prompt_variables;
  }

  private parseOverloadedArgs<V, O>(
    args: any[],
    isOptions: (arg: any) => boolean,
  ): [V, O | undefined] {
    const [arg1, arg2] = args;

    let variables: V;
    let options: O | undefined;

    if (args.length === 0) {
      variables = {} as V;
      options = undefined;
    } else if (args.length === 1) {
      if (isOptions(arg1)) {
        variables = {} as V;
        options = arg1 as O;
      } else {
        variables = arg1 as V;
        options = undefined;
      }
    } else {
      variables = arg1 as V;
      options = arg2 as O;
    }
    return [variables, options];
  }

  private async _compile(...args: any[]): Promise<CompileResult> {
    if (this.client.abortController.signal.aborted) {
      throw new Error('Client shutdown, compilation aborted');
    }
    const isCompileOptions = (arg: any): arg is CompileOptions<Agency> =>
      typeof arg === 'object' && arg !== null && 'globals' in arg;

    const [variables, options] = this.parseOverloadedArgs<
      GetPromptVariables<Agency, PromptArg>,
      CompileOptions<Agency>
    >(args, isCompileOptions);

    const { globals: globalOverrides } = options ?? { globals: {} };

    const globals = (await this.client.initializeGlobals()) as Record<string, any>;

    const { missingRequiredVariables, variablesWithDefaults } = validateVariables(
      this.variables as Database['public']['Tables']['prompt_variables']['Row'][],
      variables as Record<string, string | number | boolean | any>,
    );

    if (missingRequiredVariables.length > 0) {
      throw new Error('Missing required variables');
    }

    const { missingGlobalContext } = validateGlobalContext(this.version.content, globals);

    if (missingGlobalContext.length > 0) {
      throw new Error('Missing required global context variables');
    }

    const finalGlobalContext = merge(globals, globalOverrides);

    const finalVariables = {
      ...variablesWithDefaults,
      global: finalGlobalContext,
    };

    const compiledPrompt = compilePrompt(this.version.content, finalVariables);

    return { compiledPrompt, finalVariables };
  }

  private async _execute(...args: any[]): Promise<ExecuteImplementationResult<Agency, PromptArg>> {
    if (this.client.abortController.signal.aborted) {
      throw new Error('Client shutdown, execution aborted');
    }
    const isExecuteOptions = (arg: any): arg is ExecuteOptions<Agency> =>
      typeof arg === 'object' && arg !== null && ('config' in arg || 'globals' in arg);

    const [variables, options] = this.parseOverloadedArgs<
      GetPromptVariables<Agency, PromptArg>,
      ExecuteOptions<Agency>
    >(args, isExecuteOptions);

    const { compiledPrompt, finalVariables } = await this.compile(variables, options);

    const { config: configOverrides } = options ?? {
      config: {},
    };

    const finalConfig = merge(this.version.config, configOverrides, {
      usage: {
        include: true,
      },
    });

    // Create a log entry before making the API call
    const rawInput: OpenrouterRequestBody = {
      messages: [{ role: 'user', content: compiledPrompt }],
      ...finalConfig,
    };

    const llmLogsService = new LLMLogsService({
      supabase: this.client.supabase,
    });

    const vaultService = new VaultService({
      supabase: this.client.supabase,
    });

    const organizationsService = new OrganizationsService({
      supabase: this.client.supabase,
    });

    organizationsService.services = {
      vault: vaultService,
    } as any;

    const { data, error } = await this.client.supabase.rpc('create_llm_log_entry', {
      arg_project_uuid: this.client.projectUuid,
      arg_version_uuid: this.version.uuid,
      arg_variables: finalVariables,
      arg_raw_input: rawInput as Json,
    });

    if (error) {
      throw error;
    }

    const { log_uuid, organization_uuid } = data as {
      log_uuid: string;
      organization_uuid: string;
    };

    try {
      const { value: openrouterApiKey, error } =
        await organizationsService.getOrganizationKeySecret(
          organization_uuid,
          ORGANIZATION_KEYS.OPENROUTER_API_KEY,
        );

      if (error) {
        throw new Error(`Failed to get OpenRouter API key: ${error}`);
      }

      if (!openrouterApiKey) {
        throw new Error('OpenRouter API key not found');
      }

      const response = await fetch(routes.openrouter.chatCompletions, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openrouterApiKey}`,
          ...OPENROUTER_HEADERS,
        },
        body: JSON.stringify(rawInput),
        signal: this.client.abortController.signal,
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Failed to call OpenRouter API: ${responseText}`);
      }

      if (!response.body) {
        throw new Error('No body present in response from OpenRouter');
      }

      if (this.version.config.stream || configOverrides?.stream) {
        const [streamForClient, streamForLogging] = response.body.tee();
        const [streamForTokens, streamForUsage] = streamForClient.tee();

        const iterator = streamToIterator(streamForTokens);

        const tokens = async function* () {
          for await (const chunk of iterator) {
            const str = (chunk as OpenrouterStreamEvent).data?.choices?.[0]?.delta?.content;
            yield str;
          }
        };

        this.client.queue.add(async () => {
          let fullCompletion: any = {};
          let content = '';

          for await (const event of streamToIterator(streamForLogging)) {
            const typedEvent = event as OpenrouterStreamEvent;
            const chunk = typedEvent.data;
            // usage chunk contains null stop values we don't want to merge
            if (chunk.usage) {
              fullCompletion.usage = merge(fullCompletion.usage, chunk.usage);
            } else if (chunk.choices) {
              content += chunk.choices[0].delta.content ?? '';
              fullCompletion = merge(fullCompletion, chunk);
            }
          }

          // rewrite delta to message
          if (fullCompletion.choices?.[0]) {
            delete fullCompletion.choices[0].delta;
            fullCompletion.choices[0].message = { role: 'assistant', content };
          }

          await llmLogsService.updateLogWithCompletion(log_uuid, fullCompletion);
        });

        return {
          tokens: tokens(),
          stream: streamToIterator(streamForUsage),
          logUuid: log_uuid,
          response,
          compiledPrompt,
          finalVariables,
        } as unknown as ExecuteImplementationResult<Agency, PromptArg>;
      }

      const completion = (await response.json()) as OpenrouterNonStreamingResponse;

      const content = completion?.choices?.[0]?.message?.content ?? null;

      this.client.queue.add(async () => {
        await llmLogsService.updateLogWithCompletion(log_uuid, completion as Json);
      });

      return {
        completion,
        logUuid: log_uuid,
        response,
        content,
        compiledPrompt,
        finalVariables,
      } as unknown as ExecuteImplementationResult<Agency, PromptArg>;
    } catch (error) {
      this.client.logger.error(error);

      await llmLogsService.updateLogWithCompletion(log_uuid, {
        error: String(error),
      });

      throw new Error('Error calling OpenRouter API');
    }
  }
}
