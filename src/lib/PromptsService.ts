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
  DEFAULT_OPENROUTER_CONFIG,
} from './openrouter';
import { routes } from '@/utils/routes';
import { ORGANIZATION_KEYS, SEMVER_PATTERN } from '@/app/constants';
import { compareSemanticVersions, incrementVersion } from '@/utils/versioning';

type PromptVariable = Database['public']['Tables']['prompt_variables']['Row'];

type PromptVariableBase = Omit<
  Database['public']['Tables']['prompt_variables']['Row'],
  'created_at' | 'prompt_version_id' | 'uuid' | 'updated_at'
>;

type PromptVariableInput = Omit<PromptVariableBase, 'id'> & { id?: number };

type PromptVariableExisting = Pick<
  Database['public']['Tables']['prompt_variables']['Row'],
  'id' | 'name' | 'type' | 'required' | 'default_value'
>;

export type UpdatePromptVersionOptions = {
  promptVersionUuid: string;
  content: string;
  config: CompletionConfig;
  status: Database['public']['Enums']['prompt_status'];
  variables: Array<PromptVariableInput>;
};

export type CreatePromptWithDraftVersionOptions = {
  name: string;
  projectId: number;
};

export type CreateDraftVersionOptions = {
  promptId: number;
  latestVersion: string;
  customVersion?: string;
  versionType?: 'major' | 'minor' | 'patch';
};

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

  public compileVariables = (
    variables: PromptVariable[],
    variablesToCheck: Record<string, string | number | boolean>,
  ): {
    missingRequiredVariables: PromptVariable[];
    variablesWithDefaults: Record<string, string | number | boolean>;
  } => {
    const missingRequiredVariables = variables
      .filter((v) => v.required)
      .filter((v) => !(v.name in variablesToCheck));

    const defaultValues = variables.reduce(
      (acc, v) => (v.default_value ? { ...acc, [v.name]: v.default_value } : acc),
      {},
    );

    const variablesWithDefaults = {
      ...defaultValues,
      ...variablesToCheck,
    };

    return { missingRequiredVariables, variablesWithDefaults };
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

  public async updatePromptVersion(options: UpdatePromptVersionOptions) {
    const { promptVersionUuid, content, config, status, variables: incomingVariables } = options;

    const { data: versionData, error: getVersionError } = await this.supabase
      .from('prompt_versions')
      .select('id')
      .eq('uuid', promptVersionUuid)
      .single();

    if (getVersionError || !versionData) {
      throw new Error('Failed to find prompt version: ' + getVersionError?.message);
    }

    const promptVersionId = versionData.id;

    const { error: versionError } = await this.supabase
      .from('prompt_versions')
      .update({
        content,
        config: config as any,
        status,
      })
      .eq('uuid', promptVersionUuid);

    if (versionError) {
      throw new Error('Failed to update prompt version: ' + versionError.message);
    }

    // 1. Fetch current variables with full details
    const { data: currentVariablesData, error: getVariablesError } = await this.supabase
      .from('prompt_variables')
      .select('id, name, type, required, default_value')
      .eq('prompt_version_id', promptVersionId);

    if (getVariablesError) {
      throw new Error('Failed to fetch current variables: ' + getVariablesError.message);
    }
    const currentVariables: PromptVariableExisting[] = currentVariablesData || [];

    // 2. Prepare map for efficient comparison
    const currentVariablesMap = new Map(currentVariables.map((v) => [v.name, v]));

    // 3. Identify variables to add, update, or delete
    const variablesToAdd: PromptVariableInput[] = [];
    const variablesToUpdate: PromptVariableExisting[] = [];
    const variableIdsToDelete: number[] = [];

    for (const incomingVar of incomingVariables) {
      const currentVar = currentVariablesMap.get(incomingVar.name);
      if (currentVar) {
        const variableNeedsUpdating =
          incomingVar.type !== currentVar.type ||
          incomingVar.required !== currentVar.required ||
          incomingVar.default_value !== currentVar.default_value;

        if (variableNeedsUpdating) {
          variablesToUpdate.push({ ...incomingVar, id: currentVar.id });
        }
        currentVariablesMap.delete(incomingVar.name);
      } else {
        variablesToAdd.push(incomingVar);
      }
    }

    for (const currentVarToDelete of Array.from(currentVariablesMap.values())) {
      variableIdsToDelete.push(currentVarToDelete.id);
    }

    // 4. Perform database operations
    if (variableIdsToDelete.length > 0) {
      const { error: deleteError } = await this.supabase
        .from('prompt_variables')
        .delete()
        .in('id', variableIdsToDelete);

      if (deleteError) {
        throw new Error('Failed to delete variables: ' + deleteError.message);
      }
    }

    if (variablesToAdd.length > 0) {
      const { error: insertError } = await this.supabase.from('prompt_variables').insert(
        variablesToAdd.map((v) => ({
          prompt_version_id: promptVersionId,
          name: v.name,
          type: v.type,
          required: v.required,
          default_value: v.default_value,
        })),
      );

      if (insertError) {
        throw new Error('Failed to add new variables: ' + insertError.message);
      }
    }

    if (variablesToUpdate.length > 0) {
      for (const variableToUpdate of variablesToUpdate) {
        const { id, name, type, required, default_value } = variableToUpdate;
        const { error: updateError } = await this.supabase
          .from('prompt_variables')
          .update({ name, type, required, default_value })
          .eq('id', id);

        if (updateError) {
          throw new Error(`Failed to update variable ${name} (ID: ${id}): ${updateError.message}`);
        }
      }
    }
  }

  public async createPromptWithDraftVersion(options: CreatePromptWithDraftVersionOptions) {
    const { name, projectId } = options;

    // Generate a slug from the name
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    // Create a new prompt
    const { data: promptData, error: promptError } = await this.supabase
      .from('prompts')
      .insert({
        name,
        project_id: projectId,
        slug,
      })
      .select('id, uuid')
      .single();

    if (promptError || !promptData) {
      throw new Error('Failed to create prompt: ' + promptError?.message);
    }

    const newPromptId = promptData.id;
    const newPromptUuid = promptData.uuid;

    // Create a new draft version
    const { data: versionData, error: versionError } = await this.supabase
      .from('prompt_versions')
      .insert({
        prompt_id: newPromptId,
        content: '',
        config: DEFAULT_OPENROUTER_CONFIG as any,
        status: 'DRAFT',
        version: '0.0.1',
      })
      .select('id, uuid')
      .single();

    if (versionError || !versionData) {
      // If we failed to create a version, delete the prompt to avoid orphans
      await this.supabase.from('prompts').delete().eq('id', newPromptId);
      throw new Error('Failed to create prompt version: ' + versionError?.message);
    }

    return {
      promptUuid: newPromptUuid,
      versionUuid: versionData.uuid,
    };
  }

  public async createDraftVersion(options: CreateDraftVersionOptions) {
    const { promptId, latestVersion, customVersion, versionType = 'patch' } = options;

    // First, get ALL versions for this prompt to find existing versions
    const { data: allVersions, error: versionsError } = await this.supabase
      .from('prompt_versions')
      .select('version')
      .eq('prompt_id', promptId);

    if (versionsError) {
      throw new Error('Failed to fetch versions: ' + versionsError.message);
    }

    // Determine the new version number
    let newVersion: string;

    if (customVersion) {
      // If a custom version is provided, use it but verify it doesn't already exist
      const versionExists = allVersions?.some((v) => v.version === customVersion);
      if (versionExists) {
        throw new Error(`Version ${customVersion} already exists for this prompt`);
      }

      // Validate semantic versioning pattern
      if (!SEMVER_PATTERN.test(customVersion)) {
        throw new Error('Version must follow semantic versioning (e.g., 1.0.0)');
      }

      newVersion = customVersion;
    } else {
      // Find the highest version number
      let highestVersion = latestVersion;
      if (allVersions && allVersions.length > 0) {
        highestVersion = allVersions.reduce((highest, current) => {
          return compareSemanticVersions(current.version, highest) > 0 ? current.version : highest;
        }, latestVersion);
      }

      // Calculate new version number based on the highest version
      newVersion = incrementVersion(highestVersion, versionType);
    }

    // Get latest version to copy content
    const { data: latestVersionData, error: latestVersionError } = await this.supabase
      .from('prompt_versions')
      .select('content, config, prompt_variables(*)')
      .eq('prompt_id', promptId)
      .eq('version', latestVersion)
      .single();

    if (latestVersionError || !latestVersionData) {
      throw new Error('Failed to find latest version: ' + latestVersionError?.message);
    }

    // Create new draft version
    const { data: newVersionData, error: newVersionError } = await this.supabase
      .from('prompt_versions')
      .insert({
        prompt_id: promptId,
        content: latestVersionData.content,
        config: latestVersionData.config,
        status: 'DRAFT',
        version: newVersion,
      })
      .select('id, uuid')
      .single();

    if (newVersionError || !newVersionData) {
      throw new Error('Failed to create new version: ' + newVersionError?.message);
    }

    // Copy variables from the latest version
    if (latestVersionData.prompt_variables && latestVersionData.prompt_variables.length > 0) {
      const variablesToInsert = latestVersionData.prompt_variables.map((variable) => ({
        ...variable,
        prompt_version_id: newVersionData.id,
      }));

      const { error: variablesError } = await this.supabase
        .from('prompt_variables')
        .insert(variablesToInsert);

      if (variablesError) {
        throw new Error('Failed to copy prompt variables: ' + variablesError.message);
      }
    }

    return { versionUuid: newVersionData.uuid };
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
