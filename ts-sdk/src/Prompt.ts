import fs from 'fs';
import path from 'path';
import type { AgentsmithClient } from './AgentsmithClient';
import { Json } from '@/app/__generated__/supabase.types';
import {
  PromptJSONFileContent,
  PromptVersionFileJSONContent,
  PromptVariableFileJSONContent,
  isChatPromptFilePath,
} from '@/lib/sync/repo-file-formats';
import {
  promptJsonFilePath,
  versionJsonFilePath,
  contentJ2FilePath,
  variablesJsonFilePath,
  versionDirectoryPath,
} from '@/lib/sync/repo-paths';
import {
  validateVariables,
  validateGlobalContext,
  compilePrompt,
  extract,
} from '@/utils/template-utils';
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
  NonChatCompileResult,
  ChatCompileResult,
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
import { mergeIncludedVariables } from '@/utils/merge-included-variables';
import { OpenrouterStreamEvent, streamToIterator } from '@/utils/stream-to-iterator';
import { accumulateChatStreamToCompletion } from '@/utils/accumulate-stream';
import merge from 'lodash.merge';

type FetchedPromptFromFileSystem = {
  meta: PromptJSONFileContent;
  version: PromptVersionFileJSONContent;
  variables: PromptVariableFileJSONContent;
  content: string | null;
  includedPrompts: FetchedPromptFromFileSystem[];
  chatPrompts: {
    role: 'system' | 'user' | 'assistant' | 'tool';
    index: number;
    content: string;
  }[];
};

type PromptConstructorOptions<
  Agency extends GenericAgency,
  PromptArg extends PromptIdentifier<Agency>,
> = {
  arg: PromptArg;
  client: AgentsmithClient<Agency>;
};

type LogCompletionToFileOptions = {
  logUuid?: string;
  rawInput: any;
  rawOutput: any;
  variables: any;
};

type CreateLogEntryResult = {
  log_uuid?: string;
  organization_uuid?: string;
};

export class Prompt<Agency extends GenericAgency, PromptArg extends PromptIdentifier<Agency>> {
  public client: AgentsmithClient<Agency>;
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
    type: 'CHAT' | 'NON_CHAT';
    config: GetPromptConfig<Agency, PromptArg>;
    content: string | null;
  };
  public variables!: {
    uuid: string;
    name: string;
    type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
    required: boolean;
    default_value?: string | null;
  }[];
  public includedPrompts!: {
    slug: string;
    version: string;
    versionUuid: string;
    content: string | null;
    variables: {
      uuid: string;
      name: string;
      type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
      required: boolean;
      default_value?: string | null;
    }[];
  }[];
  public chatPrompts!:
    | {
        role: 'system' | 'user' | 'assistant' | 'tool';
        index: number;
        content: string;
      }[]
    | null;

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
        err,
      );
      await this._initFromRemote();
      this.client.logger.info(
        `Successfully initialized ${this.slug}@${this.argVersion} from remote`,
      );
    }
  }

  private async _initFromFileSystem() {
    const { meta, version, variables, content, includedPrompts, chatPrompts } =
      await this.fetchPromptFromFileSystem(this.slug, this.argVersion);

    this.meta = meta;
    this.version = {
      ...version,
      config: version.config as GetPromptConfig<Agency, PromptArg>,
      content,
    };
    this.chatPrompts = chatPrompts;
    this.variables = variables;
    this.includedPrompts = includedPrompts.map((ip) => ({
      slug: ip.meta.slug,
      version: ip.version.version,
      versionUuid: ip.version.uuid,
      content: ip.content,
      variables: ip.variables,
    }));
  }

  private async _initFromRemote() {
    if (this.client.abortController.signal.aborted) return;

    const fetchSpecificVersion = this.argVersion && this.argVersion !== 'latest';

    if (fetchSpecificVersion) {
      const { data, error } = await this.client.supabase
        .from('prompt_versions')
        .select(
          `uuid, 
          version, 
          type,
          config, 
          content, 
          prompt_variables(uuid, name, type, required, default_value), 
          prompts!inner(uuid, name, slug), 
          prompt_includes!prompt_version_id(
            prompt_versions!included_prompt_version_id(
              uuid, 
              version, 
              content, 
              prompts(slug), 
              prompt_variables(uuid, name, type, required, default_value)
            )
          )`,
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

      const { prompts, prompt_variables, prompt_includes, ...version } = data;

      this.meta = prompts;
      this.version = {
        ...version,
        config: version.config as GetPromptConfig<Agency, PromptArg>,
        content: version.content as GetPromptContent<Agency, PromptArg>,
      };
      this.variables = prompt_variables;
      this.includedPrompts = prompt_includes.map((ip) => ({
        slug: ip.prompt_versions.prompts.slug,
        version: ip.prompt_versions.version,
        versionUuid: ip.prompt_versions.uuid,
        content: ip.prompt_versions.content ?? '',
        variables: ip.prompt_versions.prompt_variables,
      }));

      return;
    }

    const { data, error } = await this.client.supabase
      .from('prompt_versions')
      .select(
        `
        uuid, 
        version, 
        type,
        config, 
        content, 
        prompts!inner(uuid, name, slug),
        prompt_variables(uuid, name, type, required, default_value),
        pv_chat_prompts(uuid, role, index, content),
        prompt_includes!prompt_version_id(
          prompt_versions!included_prompt_version_id(
            uuid, 
            version, 
            content, 
            prompts(slug), 
            prompt_variables(uuid, name, type, required, default_value)
          )
        )`,
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

    const { prompts, prompt_variables, prompt_includes, pv_chat_prompts, ...version } =
      latestVersion;

    this.meta = prompts;
    this.version = {
      ...version,
      config: version.config as GetPromptConfig<Agency, PromptArg>,
      content: version.content as GetPromptContent<Agency, PromptArg>,
    };
    this.chatPrompts = pv_chat_prompts as {
      role: 'system' | 'user' | 'assistant' | 'tool';
      index: number;
      content: string;
    }[];
    this.variables = prompt_variables;
    this.includedPrompts = prompt_includes.map((ip) => ({
      slug: ip.prompt_versions.prompts.slug,
      version: ip.prompt_versions.version,
      versionUuid: ip.prompt_versions.uuid,
      content: ip.prompt_versions.content ?? '',
      variables: ip.prompt_versions.prompt_variables,
    }));
  }

  private async fetchPromptJsonFromFileSystem(slug: string) {
    const promptJsonPath = promptJsonFilePath({
      agentsmithFolder: this.client.agentsmithDirectory,
      promptSlug: slug,
    });

    const promptJson = await fs.promises.readFile(promptJsonPath, 'utf-8');

    return JSON.parse(promptJson) as PromptJSONFileContent;
  }

  private async fetchPromptVersionJsonFromFileSystem(slug: string, version: string) {
    const versionJsonPath = versionJsonFilePath({
      agentsmithFolder: this.client.agentsmithDirectory,
      promptSlug: slug,
      version,
    });

    const versionJson = await fs.promises.readFile(versionJsonPath, 'utf-8');

    return JSON.parse(versionJson) as PromptVersionFileJSONContent;
  }

  private async fetchPromptVariablesJsonFromFileSystem(slug: string, version: string) {
    const variablesJsonPath = variablesJsonFilePath({
      agentsmithFolder: this.client.agentsmithDirectory,
      promptSlug: slug,
      version,
    });

    try {
      const variablesJson = await fs.promises.readFile(variablesJsonPath, 'utf-8');
      return JSON.parse(variablesJson) as PromptVariableFileJSONContent;
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  private async fetchPromptContentFromFileSystem(slug: string, version: string) {
    const contentJ2Path = contentJ2FilePath({
      agentsmithFolder: this.client.agentsmithDirectory,
      promptSlug: slug,
      version,
    });

    try {
      const contentJ2FileContent = await fs.promises.readFile(contentJ2Path, 'utf-8');

      return contentJ2FileContent;
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  }

  private async fetchChatPromptsFromFileSystem(slug: string, version: string) {
    const versionDirectory = versionDirectoryPath({
      agentsmithFolder: this.client.agentsmithDirectory,
      promptSlug: slug,
      version,
    });

    // read version directory and get all chat prompts
    const dirContents = await fs.promises.readdir(versionDirectory);

    const chatPromptFiles = dirContents.filter((file) => isChatPromptFilePath(file));

    const chatPrompts = await Promise.all(
      chatPromptFiles.map(async (chatPromptFile) => {
        const chatPromptPath = path.join(versionDirectory, chatPromptFile);
        const chatPromptContent = await fs.promises.readFile(chatPromptPath, 'utf-8');
        const [role, index] = chatPromptFile.split('_');
        return {
          role: role as 'system' | 'user' | 'assistant' | 'tool',
          index: parseInt(index),
          content: chatPromptContent,
        };
      }),
    );

    return chatPrompts;
  }

  private async fetchPromptFromFileSystem(
    slug: string,
    initialVersion: string | null,
  ): Promise<FetchedPromptFromFileSystem> {
    const isTargetingLatest = initialVersion === null || initialVersion === 'latest';

    const promptJson = await this.fetchPromptJsonFromFileSystem(slug);
    const targetVersion = isTargetingLatest ? promptJson.latestVersion : initialVersion;

    if (!targetVersion) {
      throw new Error(
        `No published version found for prompt ${slug} while trying to fetch latest version from file system, either publish a version or use a specific version number to use the draft.`,
      );
    }

    const [versionJson, variablesJson, content] = await Promise.all([
      this.fetchPromptVersionJsonFromFileSystem(slug, targetVersion),
      this.fetchPromptVariablesJsonFromFileSystem(slug, targetVersion),
      this.fetchPromptContentFromFileSystem(slug, targetVersion),
    ]);

    let includedPrompts: FetchedPromptFromFileSystem[] = [];
    let chatPrompts: {
      role: 'system' | 'user' | 'assistant' | 'tool';
      index: number;
      content: string;
    }[] = [];

    if (versionJson.type === 'NON_CHAT' && content) {
      const { includes } = extract(content);

      includedPrompts = await Promise.all(
        includes.map(async (include) => {
          const includedPrompt = await this.fetchPromptFromFileSystem(
            include.slug,
            include.version,
          );
          return includedPrompt;
        }),
      );
    } else {
      chatPrompts = await this.fetchChatPromptsFromFileSystem(slug, targetVersion);

      const allIncludes = [];

      for (const chatPrompt of chatPrompts) {
        const { includes } = extract(chatPrompt.content);
        allIncludes.push(...includes);
      }

      includedPrompts = await Promise.all(
        allIncludes.map(async (include) => {
          const includedPrompt = await this.fetchPromptFromFileSystem(
            include.slug,
            include.version,
          );
          return includedPrompt;
        }),
      );
    }

    return {
      meta: promptJson,
      version: versionJson,
      variables: variablesJson,
      content,
      includedPrompts,
      chatPrompts,
    };
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

  private async _compile(...args: any[]): Promise<NonChatCompileResult | ChatCompileResult> {
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

    const allVariables = mergeIncludedVariables({
      variables: this.variables,
      includedPromptVariables: this.includedPrompts.flatMap((ip) => ip.variables),
    });

    const { missingRequiredVariables, variablesWithDefaults } = validateVariables(
      allVariables,
      variables as Record<string, string | number | boolean | any>,
    );

    if (missingRequiredVariables.length > 0) {
      throw new Error('Missing required variables');
    }

    if (this.version.type === 'NON_CHAT' && this.version.content) {
      const { missingGlobalContext } = validateGlobalContext(this.version.content, globals);

      if (missingGlobalContext.length > 0) {
        throw new Error('Missing required global context variables');
      }
    }

    if (this.version.type === 'CHAT' && this.chatPrompts) {
      for (const chatPrompt of this.chatPrompts) {
        const { missingGlobalContext } = validateGlobalContext(chatPrompt.content, globals);

        if (missingGlobalContext.length > 0) {
          throw new Error('Missing required global context variables');
        }
      }
    }

    const finalGlobalContext = merge(globals, globalOverrides);

    const finalVariables = {
      ...variablesWithDefaults,
      global: finalGlobalContext,
    };

    const promptLoader = (slug: string, version: string | null) => {
      const includedPromptVersion =
        version !== null && version !== 'latest'
          ? this.includedPrompts.find((ip) => ip.slug === slug && ip.version === version)
          : this.includedPrompts
              .filter((ip) => ip.slug === slug)
              .sort((a, b) => compareSemanticVersions(b.version, a.version))[0];

      if (!includedPromptVersion) {
        throw new Error(`Included prompt ${slug}@${version} not found`);
      }

      return includedPromptVersion.content ?? '';
    };

    if (this.version.type === 'NON_CHAT' && this.version.content) {
      const compiledPrompt = compilePrompt(this.version.content, finalVariables, promptLoader);

      return { compiledPrompt, finalVariables };
    }

    const compiledMessages =
      this.chatPrompts === null
        ? []
        : this.chatPrompts
            .sort((a, b) => a.index - b.index)
            .map((chatPrompt) => {
              const compiledPrompt = compilePrompt(
                chatPrompt.content,
                finalVariables,
                promptLoader,
              );
              return { role: chatPrompt.role, content: compiledPrompt };
            });

    return { compiledMessages, finalVariables };
  }

  private async logCompletionToFile(options: LogCompletionToFileOptions) {
    const { logUuid, rawInput, rawOutput, variables } = options;

    const completionLogsDirectory = this.client.completionLogsDirectory;
    if (!completionLogsDirectory) return;

    this.client.queue.add(async () => {
      // Ensure the completionLogsDirectory exists
      await fs.promises.mkdir(completionLogsDirectory, { recursive: true });

      const logDir = this.client.completionLogDirTransformer
        ? this.client.completionLogDirTransformer({
            logUuid,
            rawInput,
            rawOutput,
            prompt: this.meta,
            promptVersion: this.version,
            variables,
            chatPrompts: this.chatPrompts,
          })
        : `${Date.now()}-${logUuid}`;

      // Create a subfolder named `${log_uuid}-${Date.now()}`
      const logFolder = path.join(completionLogsDirectory, logDir);
      await fs.promises.mkdir(logFolder, { recursive: true });

      // Save raw_input.json and raw_output.json in the subfolder
      const rawInputPath = path.join(logFolder, 'raw_input.json');
      const rawOutputPath = path.join(logFolder, 'raw_output.json');
      const variablesPath = path.join(logFolder, 'variables.json');
      await fs.promises.writeFile(rawInputPath, JSON.stringify(rawInput, null, 2));
      await fs.promises.writeFile(rawOutputPath, JSON.stringify(rawOutput, null, 2));
      await fs.promises.writeFile(variablesPath, JSON.stringify(variables, null, 2));
    });
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

    const compileResult = await this.compile(variables, options);

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
      ...(this.version.type === 'CHAT' && 'compiledMessages' in compileResult
        ? { messages: compileResult.compiledMessages }
        : {}),
      ...(this.version.type === 'NON_CHAT' && 'compiledPrompt' in compileResult
        ? finalConfig.models.includes('openrouter/auto')
          ? { messages: [{ role: 'user', content: compileResult.compiledPrompt }] }
          : { prompt: compileResult.compiledPrompt }
        : {}),
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

    const logEntryPromise = this.client.supabase.rpc('create_llm_log_entry', {
      arg_project_uuid: this.client.projectUuid,
      arg_version_uuid: this.version.uuid,
      arg_variables: compileResult.finalVariables,
      arg_raw_input: rawInput as Json,
    });

    const organizationUuid = this.client.organizationUuid;

    if (!organizationUuid) {
      throw new Error('No organization UUID found, cannot fetch OpenRouter API key');
    }

    try {
      const { value: openrouterApiKey, error } =
        await organizationsService.getOrganizationKeySecret(
          organizationUuid,
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

      const streamEnabled =
        typeof configOverrides?.stream !== 'undefined'
          ? configOverrides.stream
          : this.version.config.stream;

      if (streamEnabled) {
        const [streamForClient, streamForLogging] = response.body.tee();
        const [streamA, streamB] = streamForClient.tee();
        const [streamForTokens, streamForToolCalls] = streamA.tee();
        const [streamC, streamForReasoning] = streamB.tee();
        const [streamForCompletion, streamForStream] = streamC.tee();

        const tokens = async function* () {
          for await (const chunk of streamToIterator<OpenrouterStreamEvent>(streamForTokens)) {
            const str = chunk.data?.choices?.[0]?.delta?.content;
            if (str) {
              yield str;
            }
          }
        };

        const reasoningTokens = async function* () {
          for await (const chunk of streamToIterator<OpenrouterStreamEvent>(streamForReasoning)) {
            const str = chunk.data?.choices?.[0]?.delta?.reasoning;
            if (str) {
              yield str;
            }
          }
        };

        const toolCalls = async function* () {
          for await (const chunk of streamToIterator<OpenrouterStreamEvent>(streamForToolCalls)) {
            for (const tool of chunk.data.choices?.[0]?.delta?.tool_calls ?? []) {
              yield tool;
            }
          }
        };

        const completion = async () => {
          const stream = streamToIterator<OpenrouterStreamEvent>(streamForCompletion);
          return accumulateChatStreamToCompletion(stream);
        };

        this.client.queue.add(async () => {
          const fullCompletion = await accumulateChatStreamToCompletion(
            streamToIterator<OpenrouterStreamEvent>(streamForLogging),
          );

          const { data, error } = await logEntryPromise;
          const logEntry = data as CreateLogEntryResult | null;
          const logUuid = logEntry?.log_uuid;

          if (error) {
            this.client.logger.error(
              `Failed to create LLM log entry in Agentsmith, but continuing execution without logging. Error: ${error.message}`,
            );
          }

          this.logCompletionToFile({
            logUuid,
            rawInput,
            rawOutput: fullCompletion,
            variables: compileResult.finalVariables,
          });
          if (logUuid) {
            await llmLogsService.updateLogWithCompletion(logUuid, fullCompletion);
          }
        });

        return {
          tokens: tokens(),
          reasoningTokens: reasoningTokens(),
          stream: streamToIterator<OpenrouterStreamEvent>(streamForStream),
          completion: completion(),
          toolCalls: toolCalls(),
          logUuid: async () => {
            const { data } = await logEntryPromise;
            const logEntry = data as CreateLogEntryResult | null;
            return logEntry?.log_uuid;
          },
          response,
          ...(this.version.type === 'NON_CHAT' && 'compiledPrompt' in compileResult
            ? { compiledPrompt: compileResult.compiledPrompt }
            : {}),
          ...(this.version.type === 'CHAT' && 'compiledMessages' in compileResult
            ? { compiledMessages: compileResult.compiledMessages }
            : {}),
        } as unknown as ExecuteImplementationResult<Agency, PromptArg>;
      }

      const completion = (await response.json()) as OpenrouterNonStreamingResponse;

      const content = completion?.choices?.[0]?.message?.content ?? null;
      const reasoning = completion?.choices?.[0]?.message?.reasoning ?? null;
      const toolCalls = completion?.choices?.[0]?.message?.tool_calls ?? null;

      this.client.queue.add(async () => {
        const { data } = await logEntryPromise;
        const logEntry = data as CreateLogEntryResult | null;
        const logUuid = logEntry?.log_uuid;

        if (logUuid) {
          await llmLogsService.updateLogWithCompletion(logUuid, completion);

          this.logCompletionToFile({
            logUuid,
            rawInput,
            rawOutput: completion,
            variables: compileResult.finalVariables,
          });
        }
      });

      return {
        completion,
        logUuid: async () => {
          const { data } = await logEntryPromise;
          const logEntry = data as CreateLogEntryResult | null;
          return logEntry?.log_uuid;
        },
        response,
        content,
        reasoning,
        ...(this.version.type === 'NON_CHAT' && 'compiledPrompt' in compileResult
          ? { compiledPrompt: compileResult.compiledPrompt }
          : {}),
        ...(this.version.type === 'CHAT' && 'compiledMessages' in compileResult
          ? { compiledMessages: compileResult.compiledMessages }
          : {}),
        finalVariables: compileResult.finalVariables,
        toolCalls,
      } as unknown as ExecuteImplementationResult<Agency, PromptArg>;
    } catch (error) {
      this.client.logger.error(error);

      const { data, error: logEntryError } = await logEntryPromise;
      const logEntry = data as CreateLogEntryResult | null;
      const logUuid = logEntry?.log_uuid;

      if (logEntryError) {
        this.client.logger.error(
          `Failed to create LLM log entry in Agentsmith, but continuing execution without logging. Error: ${logEntryError.message}`,
        );
      }

      if (logUuid) {
        await llmLogsService.updateLogWithCompletion(logUuid, {
          error: `Error calling OpenRouter API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        } as any);
      }

      throw new Error('Error calling OpenRouter API');
    }
  }
}
