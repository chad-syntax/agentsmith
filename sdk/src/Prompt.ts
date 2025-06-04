import fs from 'fs';
import type { AgentsmithClient } from './AgentsmithClient';
import { Json } from '@/app/__generated__/supabase.types';
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
import { GenericAgency, PromptIdentifier, HasRequiredKeys, GetPromptVariables } from './types';
import {
  CompletionConfig,
  OPENROUTER_HEADERS,
  OpenrouterNonStreamingResponse,
  OpenrouterRequestBody,
} from '@/lib/openrouter';
import { OrganizationsService } from '@/lib/OrganizationsService';
import { LLMLogsService } from '@/lib/LLMLogsService';
import { VaultService } from '@/lib/VaultService';
import { ORGANIZATION_KEYS } from '@/app/constants';
import { routes } from '@/utils/routes';
import merge from 'lodash.merge';

type PromptConstructorOptions<
  Agency extends GenericAgency,
  PromptArg extends PromptIdentifier<Agency>,
> = {
  arg: PromptArg;
  client: AgentsmithClient<Agency>;
};

type CompileOptions<Agency extends GenericAgency> = {
  globals?: Partial<{ [K in keyof Agency['globals']]: string }>;
};

type ExecuteOptions<Agency extends GenericAgency> = {
  globals?: Partial<{ [K in keyof Agency['globals']]: string }>;
  config?: CompletionConfig;
};

type CompileArgs<Agency extends GenericAgency, PromptArg extends PromptIdentifier<Agency>> =
  HasRequiredKeys<GetPromptVariables<Agency, PromptArg>> extends true
    ? [variables: GetPromptVariables<Agency, PromptArg>, options?: CompileOptions<Agency>]
    : [options?: CompileOptions<Agency>];

type ExecuteArgs<Agency extends GenericAgency, PromptArg extends PromptIdentifier<Agency>> =
  HasRequiredKeys<GetPromptVariables<Agency, PromptArg>> extends true
    ? [variables: GetPromptVariables<Agency, PromptArg>, options?: ExecuteOptions<Agency>]
    : [options?: ExecuteOptions<Agency>];

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
    config: CompletionConfig;
    content: string;
  };
  public variables!: {
    uuid: string;
    name: string;
    type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
    required: boolean;
    default_value: string | null;
  }[];

  constructor(options: PromptConstructorOptions<Agency, PromptArg>) {
    const { arg, client } = options;
    this.client = client;

    const [slug, argVersion] = arg.split('@');

    this.slug = slug;
    this.argVersion = argVersion ?? 'latest';
  }

  public async init() {
    try {
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
          `No published version found for prompt ${this.slug} while trying to fetch latest version from file system`,
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
        config: versionJson.config,
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
          return;
        }
        console.error('Failed to read variables from the file system', err);
      }

      console.log('successfully read prompt from the file system');
      return;
    } catch (err) {
      console.error('Failed to fetch prompt from the file system', err);
    }

    const fetchSpecificVersion = this.argVersion && this.argVersion !== 'latest';

    if (fetchSpecificVersion) {
      const { data, error } = await this.client.supabase
        .from('prompt_versions')
        .select(
          'uuid, version, config, content, prompt_variables(uuid, name, type, required, default_value), prompts!inner(uuid, name, slug)',
        )
        .eq('prompts.slug', this.slug)
        .eq('version', this.argVersion)
        .single();

      if (error) {
        throw error;
      }

      const { prompts, prompt_variables, ...version } = data;

      this.meta = prompts;
      this.version = {
        ...version,
        config: version.config as CompletionConfig,
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
      .eq('status', 'PUBLISHED');

    if (error) {
      throw error;
    }

    const latestVersion = data.sort((a, b) => compareSemanticVersions(b.version, a.version))[0];

    if (!latestVersion) {
      throw new Error(
        `No published version found for prompt ${this.slug} while trying to fetch latest version`,
      );
    }

    const { prompts, prompt_variables, ...version } = latestVersion;

    this.meta = prompts;
    this.version = {
      ...version,
      config: version.config as CompletionConfig,
    };
    this.variables = prompt_variables;
  }

  public async compile(...args: CompileArgs<Agency, PromptArg>) {
    const variables = (args[0] !== undefined ? args[0] : {}) as GetPromptVariables<
      Agency,
      PromptArg
    >;
    const optionsArg = (
      args.length === 2
        ? args[1]
        : args.length === 1 &&
            typeof args[0] === 'object' &&
            args[0] !== null &&
            'globals' in args[0]
          ? args[0]
          : {}
    ) as CompileOptions<Agency> | undefined;

    const { globals: globalOverrides } = optionsArg ?? { globals: {} };

    const globals = (await this.client.initializeGlobals()) as Record<string, any>;

    const { missingRequiredVariables, variablesWithDefaults } = validateVariables(
      this.variables,
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

  public async execute(...args: ExecuteArgs<Agency, PromptArg>) {
    const { compiledPrompt, finalVariables } = await this.compile(...args);

    const optionsArg = (
      args.length === 2
        ? args[1]
        : args.length === 1 &&
            typeof args[0] === 'object' &&
            args[0] !== null &&
            ('globals' in args[0] || 'config' in args[0])
          ? args[0]
          : {}
    ) as ExecuteOptions<Agency> | undefined;

    const { config: configOverrides } = optionsArg ?? {
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

    const { log_uuid, organization_uuid } = data as { log_uuid: string; organization_uuid: string };

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
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Failed to call OpenRouter API: ${responseText}`);
      }

      const completion = (await response.json()) as OpenrouterNonStreamingResponse;

      await llmLogsService.updateLogWithCompletion(log_uuid, completion as Json);

      return { completion, logUuid: log_uuid };
    } catch (error) {
      console.error(error);

      await llmLogsService.updateLogWithCompletion(log_uuid, {
        error: String(error),
      });

      throw new Error('Error calling OpenRouter API');
    }
  }
}
