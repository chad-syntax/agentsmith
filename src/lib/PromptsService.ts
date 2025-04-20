import { Database, Json } from '@/app/__generated__/supabase.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AgentsmithSupabaseService } from './AgentsmithSupabaseService';
import { AgentsmithServicesDirectory } from './AgentsmithServices';
// @ts-ignore needs to be browser version so nextjs can import it
import nunjucks from 'nunjucks/browser/nunjucks';
import {
  OpenrouterRequestBody,
  CompletionConfig,
  fetchFreeOpenrouterModels,
  DEFAULT_OPENROUTER_MODEL,
  MAX_OPENROUTER_MODELS,
  OPENROUTER_HEADERS,
} from './openrouter';
import { routes } from '@/utils/routes';
import { ORGANIZATION_KEYS } from '@/app/constants';
import { compareSemanticVersions } from '@/utils/versioning';

type PromptVariable = Database['public']['Tables']['prompt_variables']['Row'];

type PromptsServiceConstructorOptions = {
  supabase: SupabaseClient<Database>;
};

type ExecutePromptOptions = {
  prompt: NonNullable<GetPromptByIdResult>;
  config: CompletionConfig;
  targetVersion: NonNullable<GetPromptVersionByUuidResult>;
  variables: Record<string, string | number | boolean>;
};

export class PromptsService extends AgentsmithSupabaseService {
  public services!: AgentsmithServicesDirectory;

  constructor(options: PromptsServiceConstructorOptions) {
    super({ ...options, serviceName: 'prompts' });
  }

  public async getPromptVersionByUuid(promptVersionUuid: string) {
    const { data, error } = await this.supabase
      .from('prompt_versions')
      .select('*, prompt_variables(*), prompts(*, projects(id, uuid, organizations(id, uuid)))')
      .eq('uuid', promptVersionUuid)
      .single();

    if (error) {
      console.error('Error fetching prompt version', error);
      return null;
    }

    return data;
  }

  async getPromptByUuid(promptUuid: string) {
    const { data, error } = await this.supabase
      .from('prompts')
      .select('*, projects(id, organizations(uuid))')
      .eq('uuid', promptUuid)
      .single();

    if (error) {
      console.error('Error fetching prompt:', error);
      return null;
    }

    return data;
  }

  public async getPromptsByProjectId(projectId: number) {
    const { data, error } = await this.supabase
      .from('prompts')
      .select('*, prompt_versions(*, prompt_variables(*)), projects(id, organizations(uuid))')
      .eq('project_id', projectId);

    if (error) {
      console.error('Error fetching prompts:', error);
      return [];
    }

    return data;
  }

  public getMissingVariables = (
    variables: PromptVariable[],
    variablesToCheck: Record<string, string | number | boolean>,
  ) => {
    const missingVariables = variables
      .filter((v) => v.required)
      .filter((v) => !(v.name in variablesToCheck))
      .map((v) => v.name);

    return missingVariables;
  };

  public compilePrompt = (
    promptContent: string,
    variables: Record<string, string | number | boolean>,
  ) => {
    nunjucks.configure({ autoescape: false });
    return nunjucks.renderString(promptContent, variables);
  };

  /**
   * Fetch prompt versions for a specific prompt
   */
  async getPromptVersions(promptId: number) {
    const { data, error } = await this.supabase
      .from('prompt_versions')
      .select('*')
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching prompt versions:', error);
      return [];
    }

    return data;
  }

  async getLatestPromptVersion(promptId: number) {
    const { data, error } = await this.supabase
      .from('prompt_versions')
      .select('*, prompt_variables(*)')
      .eq('prompt_id', promptId);

    if (error) {
      console.error('Error fetching prompt versions:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // First try to find published versions
    const publishedVersions = data.filter((v) => v.status === 'PUBLISHED');

    if (publishedVersions.length > 0) {
      // Sort published versions by semantic version (highest first)
      return publishedVersions.sort((a, b) => compareSemanticVersions(b.version, a.version))[0];
    }

    // If no published versions, return the latest draft by semantic version
    const draftVersions = data.filter((v) => v.status === 'DRAFT');

    if (draftVersions.length > 0) {
      return draftVersions.sort((a, b) => compareSemanticVersions(b.version, a.version))[0];
    }

    // If no data is categorized (shouldn't happen), just return the first item
    return data[0];
  }

  /**
   * Fetch a specific prompt version by ID
   */
  async getPromptVersionById(versionId: number) {
    const { data, error } = await this.supabase
      .from('prompt_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (error) {
      console.error('Error fetching prompt version:', error);
      return null;
    }

    return data;
  }

  public async getAllPromptsData(projectId: number) {
    const { data, error } = await this.supabase
      .from('prompts')
      .select('*, prompt_versions(*, prompt_variables(*))')
      .eq('project_id', projectId);

    if (error) {
      console.error('Error fetching prompts:', error);
      return [];
    }

    return data;
  }

  public async executePrompt(options: ExecutePromptOptions) {
    const { prompt, config, targetVersion, variables } = options;

    const compiledPrompt = this.compilePrompt(targetVersion.content, variables);

    const freeModelsOnlyEnabled = process.env.FREE_MODELS_ONLY === 'true';

    if (freeModelsOnlyEnabled) {
      console.log(
        'FREE_MODELS_ONLY is enabled, all completions will be made with a random free model',
      );
    }

    // Create a log entry before making the API call
    const rawInput: OpenrouterRequestBody = {
      messages: [{ role: 'user', content: compiledPrompt }],
      ...config,
      models: freeModelsOnlyEnabled
        ? (await fetchFreeOpenrouterModels())
            .sort(() => 0.5 - Math.random())
            .slice(0, MAX_OPENROUTER_MODELS)
            .map((m) => m.id)
        : ((targetVersion.config as CompletionConfig)?.models ?? [DEFAULT_OPENROUTER_MODEL]),
    };

    const logEntry = await this.services.llmLogs.createLogEntry({
      projectId: prompt.projects.id,
      promptVersionId: targetVersion.id,
      variables,
      rawInput,
    });

    if (!logEntry) {
      throw new Error('Failed to create log entry');
    }

    try {
      const { value: openrouterApiKey, error } =
        await this.services.organizations.getOrganizationKeySecret(
          prompt.projects.organizations.uuid,
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

      const completion = await response.json();

      await this.services.llmLogs.updateLogWithCompletion(logEntry.uuid, completion);

      return { completion, logUuid: logEntry.uuid };
    } catch (error) {
      console.error(error);

      await this.services.llmLogs.updateLogWithCompletion(logEntry.uuid, {
        error: String(error),
      });

      throw new Error('Error calling OpenRouter API');
    }
  }
}

export type GetPromptByIdResult = Awaited<
  ReturnType<typeof PromptsService.prototype.getPromptByUuid>
>;

export type GetAllPromptVersionsResult = Awaited<
  ReturnType<typeof PromptsService.prototype.getPromptVersions>
>;

export type GetLatestPromptVersionResult = Awaited<
  ReturnType<typeof PromptsService.prototype.getLatestPromptVersion>
>;

export type GetPromptVersionByUuidResult = Awaited<
  ReturnType<typeof PromptsService.prototype.getPromptVersionByUuid>
>;

export type GetPromptsByProjectIdResult = Awaited<
  ReturnType<typeof PromptsService.prototype.getPromptsByProjectId>
>;

export type GetAllPromptsDataResult = Awaited<
  ReturnType<typeof PromptsService.prototype.getAllPromptsData>
>;
