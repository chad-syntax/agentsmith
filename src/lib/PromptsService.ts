import { Database } from '@/app/__generated__/supabase.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AgentsmithSupabaseService } from './AgentsmithSupabaseService';
import { AgentsmithServicesDirectory } from './AgentsmithServices';
import {
  OpenrouterRequestBody,
  CompletionConfig,
  DEFAULT_OPENROUTER_MODEL,
  OPENROUTER_HEADERS,
  DEFAULT_OPENROUTER_CONFIG,
  OpenrouterNonStreamingResponse,
} from './openrouter';
import { routes } from '@/utils/routes';
import { ORGANIZATION_KEYS, SEMVER_PATTERN, VersionType } from '@/app/constants';
import { compareSemanticVersions, incrementVersion } from '@/utils/versioning';
import { compileChatPrompts, compilePrompt, ParsedInclude } from '@/utils/template-utils';
import { slugify } from '@/utils/slugify';
import { makePromptLoader } from '@/utils/make-prompt-loader';
import { IncludedPrompt } from '@/types/prompt-editor';

type PromptVariableBase = Omit<
  Database['public']['Tables']['prompt_variables']['Row'],
  'created_at' | 'prompt_version_id' | 'uuid' | 'updated_at'
>;

export type PromptVariableInput = Omit<PromptVariableBase, 'id'> & {
  id?: number;
  default_value?: string | null;
};

type PromptVariableExisting = Pick<
  Database['public']['Tables']['prompt_variables']['Row'],
  'id' | 'name' | 'type' | 'required'
> & { default_value?: string | null };

type PromptVersion = NonNullable<GetAllPromptsDataResult>[0]['prompt_versions'][0];
export type EditorPromptPvChatPrompt = {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
};

export type UpdatePromptVersionOptions = {
  projectUuid: string;
  promptVersionUuid: string;
  content: string;
  config: CompletionConfig;
  status: Database['public']['Enums']['prompt_status'];
  variables: Array<PromptVariableInput>;
  includes: Array<ParsedInclude>;
  pvChatPrompts: Array<EditorPromptPvChatPrompt>;
};

export type CreatePromptWithDraftVersionOptions = {
  name: string;
  projectId: number;
  type: Database['public']['Enums']['prompt_type'];
};

export type CreateDraftVersionOptions = {
  promptId: number;
  latestVersion: string;
  customVersion?: string;
  versionType?: VersionType;
};

type PromptsServiceConstructorOptions = {
  supabase: SupabaseClient<Database>;
};

type ExecutePromptOptions = {
  prompt: NonNullable<GetPromptByIdResult>;
  config: CompletionConfig;
  targetVersion: NonNullable<GetPromptVersionByUuidResult>;
  variables: Record<string, string | number | boolean | object>;
  promptIncludes: NonNullable<GetPromptVersionByUuidResult>['prompt_includes'];
  globalContext: Record<string, any>;
};

type CreatePromptOptions = {
  projectId: number;
  slug: string;
  name: string;
  sha: string;
};

type UpdatePromptOptions = {
  promptUuid: string;
  projectId: number;
  name: string;
  sha: string;
};

type CreateVersionOptions = {
  projectId: number;
  promptSlug: string;
  uuid: string;
  version: string;
  status: Database['public']['Enums']['prompt_status'];
  config: CompletionConfig;
  content: string;
  versionSha: string;
  contentSha: string;
  variablesSha: string | null;
  type: Database['public']['Enums']['prompt_type'];
};

type UpdatePromptVersionSinglularOptions = {
  promptVersionUuid: string;
  config: CompletionConfig;
  status: Database['public']['Enums']['prompt_status'];
  sha: string;
};

type CreatePromptVariablesOptions = {
  promptVersionUuid: string;
  variables: PromptVariableInput[];
};

type UpdatePromptVariablesOptions = {
  promptSlug: string;
  promptVersion: string;
  variables: PromptVariableInput[];
  sha: string;
};

type UpdatePromptVersionContentOptions = {
  promptVersionUuid: string;
  content: string;
  contentSha: string;
};

export type FetchIncludedPromptVersionOptions = {
  projectUuid: string;
  slug: string;
  version: string | 'latest' | null;
};

type ResolvePromptIncludesOptions = {
  projectId: number;
  parsedIncludes: ParsedInclude[];
};

export class PromptsService extends AgentsmithSupabaseService {
  public services!: AgentsmithServicesDirectory;

  constructor(options: PromptsServiceConstructorOptions) {
    super({ ...options, serviceName: 'prompts' });
  }

  public async getPromptVersionByUuid(promptVersionUuid: string) {
    const { data, error } = await this.supabase
      .from('prompt_versions')
      .select(
        `*, 
         prompt_variables(*), 
         prompt_includes!prompt_version_id(
           prompt_versions!included_prompt_version_id(
             version, 
             uuid, 
             content, 
             prompts(slug), 
             prompt_variables(*)
           )
         ), 
         prompts(
           *, 
           projects(
             id, 
             uuid, 
             global_contexts(content), 
             organizations(id, uuid)
           )
         ),
         pv_chat_prompts(*)`,
      )
      .eq('uuid', promptVersionUuid)
      .single();

    if (error) {
      this.logger.error(error, 'Error fetching prompt version');
      return null;
    }

    return data;
  }

  async getPromptByUuid(promptUuid: string) {
    const { data, error } = await this.supabase
      .from('prompts')
      .select('*, projects(id, uuid, organizations(uuid), global_contexts(content))')
      .eq('uuid', promptUuid)
      .single();

    if (error) {
      this.logger.error(error, 'Error fetching prompt by uuid:');
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
      this.logger.error(error, 'Error fetching prompts:');
      return [];
    }

    return data;
  }

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
      this.logger.error(error, 'Error fetching prompt versions:');
      return [];
    }

    return data;
  }

  async getLatestPromptVersion(promptId: number) {
    const { data, error } = await this.supabase
      .from('prompt_versions')
      .select(
        '*, prompts(*), prompt_variables(*), prompt_includes!prompt_version_id(prompt_versions!included_prompt_version_id(version, uuid, content, prompts(slug), prompt_variables(*)))',
      )
      .eq('prompt_id', promptId);

    if (error) {
      this.logger.error(error, 'Error fetching prompt versions:');
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
      this.logger.error(error, 'Error fetching prompt version:');
      return null;
    }

    return data;
  }

  public async getAllPromptsData(projectId: number) {
    const { data, error } = await this.supabase
      .from('prompts')
      .select(
        `*, 
         prompt_versions(
           *, 
           prompts(*), 
           prompt_includes!prompt_version_id(
             prompt_versions!included_prompt_version_id(
               version, 
               uuid, 
               content, 
               prompts(slug), 
               prompt_variables(*)
             )
           ), 
           prompt_variables(*),
           pv_chat_prompts(*)
         )`,
      )
      .eq('project_id', projectId);

    if (error) {
      this.logger.error(error, 'Error fetching prompts:');
      return [];
    }

    return data;
  }

  public async createPrompt(options: CreatePromptOptions) {
    const { projectId, slug, name, sha } = options;

    const { data, error } = await this.supabase
      .from('prompts')
      .insert({
        project_id: projectId,
        slug,
        name,
        last_sync_git_sha: sha,
      })
      .select('*')
      .single();

    if (error) {
      this.logger.error(error, 'Error creating prompt:');
      return null;
    }

    return data;
  }

  public async updatePrompt(options: UpdatePromptOptions) {
    const { promptUuid, projectId, name, sha } = options;

    const { data, error } = await this.supabase
      .from('prompts')
      .update({ name, last_sync_git_sha: sha })
      .eq('uuid', promptUuid)
      .eq('project_id', projectId)
      .single();

    if (error) {
      this.logger.error(error, 'Error updating prompt:');
      return null;
    }

    return data;
  }

  public async createPromptVersion(options: CreateVersionOptions) {
    const {
      promptSlug,
      uuid,
      version,
      status,
      config,
      content,
      versionSha,
      contentSha,
      variablesSha,
      projectId,
      type,
    } = options;

    const { data: promptData, error: getPromptError } = await this.supabase
      .from('prompts')
      .select('id')
      .eq('slug', promptSlug)
      .eq('project_id', projectId)
      .single();

    if (getPromptError || !promptData) {
      this.logger.error(getPromptError, 'Error fetching prompt to create version:');
      return null;
    }

    const promptId = promptData.id;

    const { data, error } = await this.supabase
      .from('prompt_versions')
      .insert({
        prompt_id: promptId,
        uuid,
        version,
        status,
        config: config as any,
        last_sync_git_sha: versionSha,
        last_sync_content_sha: contentSha,
        last_sync_variables_sha: variablesSha,
        content,
        type,
      })
      .select('*')
      .single();

    if (error) {
      this.logger.error(error, 'Error creating version:');
      throw error;
    }

    return data;
  }

  public async updatePromptVersionSinglular(options: UpdatePromptVersionSinglularOptions) {
    const { promptVersionUuid, config, status, sha } = options;

    const { data: versionData, error: versionError } = await this.supabase
      .from('prompt_versions')
      .update({
        config: config as any,
        status,
        last_sync_git_sha: sha,
      })
      .eq('uuid', promptVersionUuid)
      .select('*')
      .maybeSingle();

    if (versionError) {
      this.logger.error(versionError, 'Error updating prompt version:');
      return null;
    }

    return versionData;
  }

  public async createPromptVariables(options: CreatePromptVariablesOptions) {
    const { promptVersionUuid, variables } = options;

    const { data: promptVersionData, error: getPromptVersionError } = await this.supabase
      .from('prompt_versions')
      .select('id')
      .eq('uuid', promptVersionUuid)
      .maybeSingle();

    if (getPromptVersionError) {
      this.logger.error(
        getPromptVersionError,
        'Error fetching prompt version to create variables:',
      );
      return null;
    }

    if (!promptVersionData) {
      this.logger.error(
        `Prompt version with uuid ${promptVersionUuid} not found to create variables`,
      );
      return null;
    }

    const promptVersionId = promptVersionData.id;

    const { data: createdVariables, error: createError } = await this.supabase
      .from('prompt_variables')
      .insert(
        variables.map((v) => ({
          ...v,
          prompt_version_id: promptVersionId,
        })),
      )
      .select('*');

    if (createError) {
      this.logger.error(createError, 'Error creating prompt variables:');
      return null;
    }

    return createdVariables;
  }

  public async updatePromptVariables(options: UpdatePromptVariablesOptions) {
    const { promptSlug, promptVersion, variables, sha } = options;

    const { data: promptData, error: getPromptError } = await this.supabase
      .from('prompt_variables')
      .select('*, prompt_versions!inner(version), prompts!inner(slug)')
      .eq('prompt_version.version', promptVersion)
      .eq('prompt.slug', promptSlug);

    if (getPromptError || !promptData) {
      this.logger.error(getPromptError, 'Error fetching prompt variables:');
      return null;
    }

    const mungedVariables = promptData.map((v) => ({
      ...v,
      ...variables.find((v2) => v2.name === v.name),
    }));

    const { data: updatedVariables, error: updateError } = await this.supabase
      .from('prompt_variables')
      .upsert(mungedVariables)
      .select('*');

    if (updateError) {
      this.logger.error(updateError, 'Error updating prompt variables:');
      return null;
    }

    return updatedVariables;
  }

  public async updatePromptVersionContent(options: UpdatePromptVersionContentOptions) {
    const { promptVersionUuid, content, contentSha } = options;

    const { data: versionData, error: getVersionError } = await this.supabase
      .from('prompt_versions')
      .select('id')
      .eq('uuid', promptVersionUuid)
      .maybeSingle();

    if (getVersionError) {
      throw new Error('Failed to find prompt version: ' + getVersionError?.message);
    }

    if (!versionData) {
      throw new Error(`Prompt version with uuid ${promptVersionUuid} not found`);
    }

    const promptVersionId = versionData.id;

    const { error: updateError } = await this.supabase
      .from('prompt_versions')
      .update({ content, last_sync_content_sha: contentSha })
      .eq('id', promptVersionId);

    if (updateError) {
      throw new Error('Failed to update prompt version content: ' + updateError.message);
    }
  }

  public async updatePromptSha(options: { promptUuid: string; sha: string | null }) {
    const { promptUuid, sha } = options;
    const { error } = await this.supabase
      .from('prompts')
      .update({ last_sync_git_sha: sha })
      .eq('uuid', promptUuid);

    if (error) {
      throw new Error(`Failed to update prompt SHA for ${promptUuid}: ${error.message}`);
    }
  }

  public async updatePromptVersionSha(options: { promptVersionUuid: string; sha: string | null }) {
    const { promptVersionUuid, sha } = options;
    const { error } = await this.supabase
      .from('prompt_versions')
      .update({ last_sync_git_sha: sha })
      .eq('uuid', promptVersionUuid);

    if (error) {
      throw new Error(
        `Failed to update prompt version SHA for ${promptVersionUuid}: ${error.message}`,
      );
    }
  }

  public async updatePromptVersionVariablesSha(options: {
    promptVersionUuid: string;
    sha: string | null;
  }) {
    const { promptVersionUuid, sha } = options;
    const { error } = await this.supabase
      .from('prompt_versions')
      .update({ last_sync_variables_sha: sha })
      .eq('uuid', promptVersionUuid);

    if (error) {
      throw new Error(
        `Failed to update prompt version variables SHA for ${promptVersionUuid}: ${error.message}`,
      );
    }
  }

  public async updatePromptVersionContentSha(options: {
    promptVersionUuid: string;
    sha: string | null;
  }) {
    const { promptVersionUuid, sha } = options;
    const { error } = await this.supabase
      .from('prompt_versions')
      .update({ last_sync_content_sha: sha })
      .eq('uuid', promptVersionUuid);

    if (error) {
      throw new Error(
        `Failed to update prompt version content SHA for ${promptVersionUuid}: ${error.message}`,
      );
    }
  }

  public async resolveParsedIncludes(options: ResolvePromptIncludesOptions) {
    const { projectId, parsedIncludes } = options;

    const includedPrompts: IncludedPrompt[] = [];

    const notExistingIncludes = new Set<string>();

    const results = await Promise.all(
      parsedIncludes.map(async (parsedInclude) => {
        try {
          let query = this.supabase
            .from('prompts')
            .select('*, prompt_versions(*, prompt_variables(*))')
            .eq('slug', parsedInclude.slug)
            .eq('project_id', projectId);

          if (parsedInclude.version === null || parsedInclude.version === 'latest') {
            query = query
              .order('created_at', { ascending: false, referencedTable: 'prompt_versions' })
              .limit(1, { referencedTable: 'prompt_versions' });
          } else {
            query = query.eq('prompt_versions.version', parsedInclude.version);
          }

          const { data, error } = await query.maybeSingle();

          if (error) {
            this.logger.error(error, 'Error fetching included prompt');
            return { error, parsedInclude };
          }

          if (!data || data.prompt_versions.length === 0) {
            return { notFound: true, parsedInclude };
          }

          const includedPrompt: IncludedPrompt = {
            prompt_versions: {
              version: data.prompt_versions[0].version,
              uuid: data.prompt_versions[0].uuid,
              content: data.prompt_versions[0].content,
              prompts: {
                slug: parsedInclude.slug,
              },
              prompt_variables: data.prompt_versions[0].prompt_variables,
            },
          };

          return { includedPrompt };
        } catch (error) {
          this.logger.error(error, 'Unknown Error getting includes');
          return { error, parsedInclude };
        }
      }),
    );

    for (const result of results) {
      if (result?.error) {
        // If any error occurred, return early (mimics original behavior)
        return;
      }
      if (result?.notFound) {
        notExistingIncludes.add(result.parsedInclude.arg);
        continue;
      }
      if (result?.includedPrompt) {
        includedPrompts.push(result.includedPrompt);
      }
    }

    return { includedPrompts, notExistingIncludes };
  }

  public async fetchPromptIncludes(promptVersionUuid: string) {
    const { data, error } = await this.supabase
      .from('prompt_versions')
      .select(
        'prompt_includes!prompt_version_id(id, prompt_versions!included_prompt_version_id(id, version, status, prompts(slug)))',
      )
      .eq('uuid', promptVersionUuid)
      .single();

    if (error) {
      this.logger.error(
        error,
        'Failed to fetch prompt includes for prompt version: ' + promptVersionUuid,
      );
      throw new Error('Failed to fetch prompt includes: ' + error.message);
    }

    const includes: (ParsedInclude & { id: number; isLatest: boolean })[] = (
      data.prompt_includes || []
    )
      .sort((a, b) => compareSemanticVersions(b.prompt_versions.version, a.prompt_versions.version))
      .map((promptInclude, index) => ({
        id: promptInclude.id,
        isLatest: index === 0 && promptInclude.prompt_versions.status === 'PUBLISHED',
        arg: `${promptInclude.prompt_versions.prompts.slug}@${promptInclude.prompt_versions.version}`,
        slug: promptInclude.prompt_versions.prompts.slug,
        version: promptInclude.prompt_versions.version,
      }));

    return includes;
  }

  public async fetchIncludedPromptVersion(
    options: FetchIncludedPromptVersionOptions,
  ): Promise<{ id: number; content: string }> {
    const { projectUuid, slug, version } = options;

    let query = this.supabase
      .from('prompts')
      .select('projects!inner(uuid), prompt_versions(id, content)')
      .eq('projects.uuid', projectUuid)
      .eq('slug', slug);

    if (version === null || version === 'latest') {
      // TODO: use semver psql extension or something else to make sure we can accurately determine latest version
      query = query
        .order('created_at', { ascending: false, referencedTable: 'prompt_versions' })
        .limit(1, { referencedTable: 'prompt_versions' });
    } else {
      query = query.eq('prompt_versions.version', version);
    }

    const { data: promptVersionData, error: getPromptVersionError } = await query;

    if (getPromptVersionError) {
      this.logger.error(getPromptVersionError, 'Failed to get prompt version');
      throw new Error('Failed to get included prompt version: ' + getPromptVersionError.message);
    }

    const includedPromptVersion = promptVersionData?.[0]?.prompt_versions?.[0];

    if (!includedPromptVersion) {
      throw new Error(`Failed to find included prompt version for ${slug}@${version}`);
    }

    return includedPromptVersion;
  }

  public async updatePromptVersion(options: UpdatePromptVersionOptions) {
    const {
      projectUuid,
      promptVersionUuid,
      content,
      config,
      status,
      variables: incomingVariables,
      includes: incomingIncludes,
      pvChatPrompts: incomingPvChatPrompts,
    } = options;

    const { data: versionData, error: getVersionError } = await this.supabase
      .from('prompt_versions')
      .select('*, prompt_variables(*)')
      .eq('uuid', promptVersionUuid)
      .single();

    if (getVersionError) {
      throw new Error('Failed to find prompt version: ' + getVersionError?.message);
    }

    if (!versionData) {
      throw new Error(`Prompt version with uuid ${promptVersionUuid} not found`);
    }

    const promptVersionId = versionData.id;

    const currentVariables: PromptVariableExisting[] = versionData.prompt_variables || [];
    const currentIncludes = await this.fetchPromptIncludes(promptVersionUuid);

    const includesToAdd: ParsedInclude[] = [];
    const includeIdsToDelete: number[] = [];

    // if an incoming include does not exist in the db, we need to add it
    for (const incomingInclude of incomingIncludes) {
      const currentInclude = currentIncludes.find((ci) => {
        const slugMatches = ci.slug === incomingInclude.slug;
        if (!slugMatches) return false;

        const isLatestIncoming =
          incomingInclude.version === 'latest' || incomingInclude.version === null;

        // Exact match
        if (ci.version === incomingInclude.version) return true;

        // Match if incoming is latest and current is the latest published
        if (ci.isLatest && isLatestIncoming) return true;

        // Match if incoming is latest, and it's the only one for that slug
        const isOnlyVersionForSlug =
          currentIncludes.filter((c) => c.slug === incomingInclude.slug).length === 1;
        if (isLatestIncoming && isOnlyVersionForSlug) return true;

        return false;
      });

      if (!currentInclude) {
        includesToAdd.push(incomingInclude);
      }
    }

    // if a current include does not exist in the incoming, we need to delete it
    for (const currentInclude of currentIncludes) {
      const incomingInclude = incomingIncludes.find((ii) => {
        const slugMatches = ii.slug === currentInclude.slug;
        if (!slugMatches) return false;

        const isLatestIncoming = ii.version === 'latest' || ii.version === null;

        // Exact match
        if (ii.version === currentInclude.version) return true;

        // Match if incoming is latest and current is the latest published
        if (currentInclude.isLatest && isLatestIncoming) return true;

        // Match if incoming is latest, and it's the only one for that slug
        const isOnlyVersionForSlug =
          currentIncludes.filter((c) => c.slug === currentInclude.slug).length === 1;
        if (isLatestIncoming && isOnlyVersionForSlug) return true;

        return false;
      });

      if (!incomingInclude) {
        includeIdsToDelete.push(currentInclude.id);
      }
    }

    if (includesToAdd.length > 0) {
      for (const include of includesToAdd) {
        const includedPromptVersion = await this.fetchIncludedPromptVersion({
          projectUuid,
          slug: include.slug,
          version: include.version,
        });

        const { error: insertError } = await this.supabase.from('prompt_includes').insert({
          prompt_version_id: promptVersionId,
          included_prompt_version_id: includedPromptVersion.id,
        });

        if (insertError) {
          this.logger.error(
            { error: insertError, includes: includesToAdd },
            'Failed to add includes',
          );
          throw new Error('Failed to add includes: ' + insertError.message);
        }
      }
    }

    if (includeIdsToDelete.length > 0) {
      const { error: deleteError } = await this.supabase
        .from('prompt_includes')
        .delete()
        .in('id', includeIdsToDelete);

      if (deleteError) {
        this.logger.error(
          { error: deleteError, includes: includeIdsToDelete },
          'Failed to delete includes',
        );
        throw new Error('Failed to delete includes: ' + deleteError.message);
      }
    }

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
        this.logger.error(
          { error: deleteError, variables: variableIdsToDelete },
          'Failed to delete variables',
        );
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
        this.logger.error(
          { error: insertError, variables: variablesToAdd },
          'Failed to add new variables',
        );
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
          this.logger.error(
            { error: updateError, variable: variableToUpdate },
            'Failed to update variable',
          );
          throw new Error(`Failed to update variable ${name} (ID: ${id}): ${updateError.message}`);
        }
      }
    }

    // TODO: handle pv chat prompts better

    // delete all existing pv chat prompts for this version
    const { error: deleteError } = await this.supabase
      .from('pv_chat_prompts')
      .delete()
      .eq('prompt_version_id', promptVersionId);

    if (deleteError) {
      throw new Error('Failed to delete pv chat prompts: ' + deleteError.message);
    }

    // add new pv chat prompts for this version
    const { error: insertError } = await this.supabase.from('pv_chat_prompts').insert(
      incomingPvChatPrompts.map((pvChatPrompt) => ({
        prompt_version_id: promptVersionId,
        role: pvChatPrompt.role,
        content: pvChatPrompt.content,
      })),
    );

    if (insertError) {
      throw new Error('Failed to add pv chat prompts: ' + insertError.message);
    }

    const updatePayload: Database['public']['Tables']['prompt_versions']['Update'] = {
      content,
      config: config as any,
      status,
    };

    // if we had any changes to the config or status, we need to reset the git sha
    if (
      JSON.stringify(config) !== JSON.stringify(versionData.config) ||
      status !== versionData.status
    ) {
      updatePayload.last_sync_git_sha = null;
    }

    // if we had any changes to the content, we need to reset the content sha
    if (content !== versionData.content) {
      updatePayload.last_sync_content_sha = null;
    }

    // if we had any changes to the variables, we need to reset the variables sha
    if (
      variablesToAdd.length > 0 ||
      variablesToUpdate.length > 0 ||
      variableIdsToDelete.length > 0
    ) {
      updatePayload.last_sync_variables_sha = null;
    }

    const { error: versionError } = await this.supabase
      .from('prompt_versions')
      .update(updatePayload)
      .eq('uuid', promptVersionUuid);

    if (versionError) {
      throw new Error('Failed to update prompt version: ' + versionError.message);
    }
  }

  public async createPromptWithDraftVersion(options: CreatePromptWithDraftVersionOptions) {
    const { name, projectId, type } = options;

    // Generate a slug from the name
    const slug = slugify(name);

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
        type,
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
      .select(
        'type, content, config, prompt_variables(*), prompt_includes!prompt_version_id(*), pv_chat_prompts(*)',
      )
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
        type: latestVersionData.type,
      })
      .select('id, uuid')
      .single();

    if (newVersionError || !newVersionData) {
      throw new Error('Failed to create new version: ' + newVersionError?.message);
    }

    // Copy variables from the latest version
    if (latestVersionData.prompt_variables && latestVersionData.prompt_variables.length > 0) {
      const variablesToInsert = latestVersionData.prompt_variables.map(
        ({ id, uuid, ...variable }) => ({
          ...variable,
          prompt_version_id: newVersionData.id,
        }),
      );

      const { error: variablesError } = await this.supabase
        .from('prompt_variables')
        .insert(variablesToInsert);

      if (variablesError) {
        throw new Error('Failed to copy prompt variables: ' + variablesError.message);
      }
    }

    // Copy includes from the latest version
    if (latestVersionData.prompt_includes && latestVersionData.prompt_includes.length > 0) {
      const includesToInsert = latestVersionData.prompt_includes.map(({ id, ...include }) => ({
        ...include,
        prompt_version_id: newVersionData.id,
      }));

      const { error: includesError } = await this.supabase
        .from('prompt_includes')
        .insert(includesToInsert);

      if (includesError) {
        throw new Error('Failed to copy prompt includes: ' + includesError.message);
      }
    }

    // copy the pv chat prompts from the latest version
    if (latestVersionData.pv_chat_prompts && latestVersionData.pv_chat_prompts.length > 0) {
      const pvChatPromptsToInsert = latestVersionData.pv_chat_prompts.map(
        ({ id, ...pvChatPrompt }) => ({
          ...pvChatPrompt,
          prompt_version_id: newVersionData.id,
        }),
      );

      const { error: pvChatPromptsError } = await this.supabase
        .from('pv_chat_prompts')
        .insert(pvChatPromptsToInsert);

      if (pvChatPromptsError) {
        throw new Error('Failed to copy pv chat prompts: ' + pvChatPromptsError.message);
      }
    }

    return { versionUuid: newVersionData.uuid };
  }

  public async executePrompt(options: ExecutePromptOptions) {
    const { prompt, config, targetVersion, variables, promptIncludes, globalContext } = options;

    const variablesAndContext = {
      ...variables,
      global: globalContext,
    };

    const promptLoader = makePromptLoader(promptIncludes);

    // Create a log entry before making the API call
    const rawInput: OpenrouterRequestBody = {
      ...config,
      models: (targetVersion.config as CompletionConfig)?.models ?? [DEFAULT_OPENROUTER_MODEL],
      usage: {
        include: true,
      },
    };

    if (targetVersion.type === 'NON_CHAT' && !rawInput.models?.includes('openrouter/auto')) {
      const compiledPrompt = compilePrompt(
        targetVersion.content,
        variablesAndContext,
        promptLoader,
      );
      rawInput.prompt = compiledPrompt;
    } else if (targetVersion.type === 'NON_CHAT') {
      const compiledPrompt = compilePrompt(
        targetVersion.content,
        variablesAndContext,
        promptLoader,
      );
      rawInput.messages = [{ role: 'user', content: compiledPrompt }];
    } else {
      const compiledMessages = compileChatPrompts(
        targetVersion.pv_chat_prompts as EditorPromptPvChatPrompt[],
        variablesAndContext,
        promptLoader,
      );
      rawInput.messages = compiledMessages;
    }

    const logEntry = await this.services.llmLogs.createLogEntry({
      projectId: prompt.projects.id,
      promptVersionId: targetVersion.id,
      variables: variablesAndContext,
      rawInput,
      source: 'STUDIO',
    });

    if (!logEntry) {
      // TODO: this should not break the whole thing, should create an alert instead and continue
      throw new Error('Failed to create log entry, please check your plan limits and try again.');
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

        let errorMessage;
        try {
          errorMessage = JSON.parse(responseText).error.message;
        } catch (error) {
          errorMessage = responseText;
        }
        throw new Error(errorMessage);
      }

      if (config.stream) {
        return {
          stream: response.body,
          logUuid: logEntry.uuid,
        };
      }

      const completion = (await response.json()) as OpenrouterNonStreamingResponse;

      await this.services.llmLogs.updateLogWithCompletion(logEntry.uuid, completion);

      return { completion, logUuid: logEntry.uuid };
    } catch (error) {
      this.logger.warn(error, 'Error calling OpenRouter API');

      const errorMessage = `Error calling OpenRouter API: ${error instanceof Error ? error.message : 'Unknown error'}`;

      await this.services.llmLogs.updateLogWithCompletion(logEntry.uuid, {
        error: errorMessage,
      });

      throw new Error(errorMessage);
    }
  }

  public async getPromptByProjectIdAndSlug(projectId: number, slug: string) {
    const { data, error } = await this.supabase
      .from('prompts')
      .select('*') // Select all columns, or specify if only certain ones are needed (e.g., uuid)
      .eq('project_id', projectId)
      .eq('slug', slug)
      .single(); // Assuming slug is unique per project

    if (error) {
      this.logger.error(
        error,
        `Error fetching prompt by project ID ${projectId} and slug ${slug}:`,
      );
      return null;
    }
    return data;
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
