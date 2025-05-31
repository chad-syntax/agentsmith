import { SupabaseClient } from '@supabase/supabase-js';
import { GenericAgency, PromptIdentifier, GetPromptVariables, HasRequiredKeys } from './types';
import { Database } from '@/app/__generated__/supabase.types';
import { compareSemanticVersions } from '@/utils/versioning';
import { compilePrompt } from '@/utils/template-utils';
import { validateGlobalContext } from '@/utils/template-utils';
import { validateVariables } from '@/utils/template-utils';
import { createJwtClient, exchangeApiKeyForJwt } from '@/lib/supabase/server-api-key';

type AgentsmithClientOptions = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const defaultOptions: Omit<AgentsmithClientOptions, 'project'> = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export class AgentsmithClient<Agency extends GenericAgency> {
  public supabase!: SupabaseClient<Database>;
  private sdkApiKey: string;
  private projectUuid: string;
  private fetchGlobalsPromise: Promise<Agency['globals']> | null = null;
  private projectGlobals: Agency['globals'] | null = null;
  private initializePromise: Promise<void>;

  constructor(sdkApiKey: string, projectId: string, options: AgentsmithClientOptions = {}) {
    const { supabaseUrl, supabaseAnonKey } = { ...defaultOptions, ...options };
    this.sdkApiKey = sdkApiKey;
    this.projectUuid = projectId;
    this.initializePromise = this.initialize(supabaseUrl!, supabaseAnonKey!);
    this.fetchGlobals();
  }

  private async initialize(supabaseUrl: string, supabaseAnonKey: string) {
    const jwt = await exchangeApiKeyForJwt(this.sdkApiKey, supabaseUrl, supabaseAnonKey);

    this.supabase = createJwtClient(jwt);
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

  public async fetchGlobals(): Promise<Agency['globals']> {
    await this.initializePromise;

    if (this.projectGlobals) {
      return this.projectGlobals;
    }

    if (this.fetchGlobalsPromise) {
      return this.fetchGlobalsPromise;
    }

    this.fetchGlobalsPromise = (async (): Promise<Agency['globals']> => {
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
    })();

    return this.fetchGlobalsPromise;
  }
}

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

type CompileArgs<Agency extends GenericAgency, PromptArg extends PromptIdentifier<Agency>> =
  HasRequiredKeys<GetPromptVariables<Agency, PromptArg>> extends true
    ? [variables: GetPromptVariables<Agency, PromptArg>, options?: CompileOptions<Agency>]
    : [options?: CompileOptions<Agency>];

class Prompt<Agency extends GenericAgency, PromptArg extends PromptIdentifier<Agency>> {
  private client: AgentsmithClient<Agency>;
  private slug: string;
  private argVersion: string;
  public meta!: Pick<Database['public']['Tables']['prompts']['Row'], 'uuid' | 'name' | 'slug'>;
  public version!: Pick<
    Database['public']['Tables']['prompt_versions']['Row'],
    'uuid' | 'version' | 'config' | 'content'
  >;
  public variables!: Pick<
    Database['public']['Tables']['prompt_variables']['Row'],
    'uuid' | 'name' | 'type' | 'required' | 'default_value'
  >[];

  constructor(options: PromptConstructorOptions<Agency, PromptArg>) {
    const { arg, client } = options;
    this.client = client;

    const [slug, argVersion] = arg.split('@');

    this.slug = slug;
    this.argVersion = argVersion ?? 'latest';
  }

  public async init() {
    // TODO fetch from the file system first if it exists
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
      this.version = version;
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
    this.version = version;
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
    ) as { globals?: CompileOptions<Agency> } | undefined;

    const { globals: globalOverrides } = optionsArg ?? { globals: {} };

    const globals = (await this.client.fetchGlobals()) as Record<string, any>;

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

    const compiledPrompt = compilePrompt(this.version.content, {
      ...variablesWithDefaults,
      global: {
        ...globals,
        ...globalOverrides,
      },
    });

    return compiledPrompt;
  }
}

export * from './types';
