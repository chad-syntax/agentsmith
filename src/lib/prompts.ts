// @ts-ignore needs to be browser version so nextjs can import it
import nunjucks from 'nunjucks/browser/nunjucks';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/app/__generated__/supabase.types';
import { FREE_MODELS, OpenrouterRequestBody } from './openrouter';
import { createLogEntry, updateLogWithCompletion } from './logs';
import { compareSemanticVersions } from '@/utils/versioning';
import {
  DEFAULT_OPENROUTER_MODEL,
  MAX_OPENROUTER_MODELS,
  OPENROUTER_COMPLETIONS_URL,
  OPENROUTER_HEADERS,
} from '@/app/constants';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Fetch the latest prompt version for a specific prompt
 * Prioritizes PUBLISHED versions over DRAFT versions
 * Within each status, sorts by semantic version (highest version first)
 */
export const getLatestPromptVersion = async (promptId: number) => {
  const supabase = await createClient();

  const { data, error } = await supabase
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
    return publishedVersions.sort((a, b) =>
      compareSemanticVersions(b.version, a.version)
    )[0];
  }

  // If no published versions, return the latest draft by semantic version
  const draftVersions = data.filter((v) => v.status === 'DRAFT');

  if (draftVersions.length > 0) {
    return draftVersions.sort((a, b) =>
      compareSemanticVersions(b.version, a.version)
    )[0];
  }

  // If no data is categorized (shouldn't happen), just return the first item
  return data[0];
};

export type GetLatestPromptVersionResult = Awaited<
  ReturnType<typeof getLatestPromptVersion>
>;

/**
 * Fetch all prompts for a project
 */
export const getPromptsByProjectId = async (projectId: number) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompts')
    .select('*, prompt_versions(*, prompt_variables(*))')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching prompts:', error);
    return [];
  }

  return data;
};

export type GetPromptsByProjectIdResult = Awaited<
  ReturnType<typeof getPromptsByProjectId>
>;

/**
 * Fetch a specific prompt by ID
 */
export const getPromptById = async (promptUuid: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompts')
    .select('*, projects(id, organizations(uuid))')
    .eq('uuid', promptUuid)
    .single();

  if (error) {
    console.error('Error fetching prompt:', error);
    return null;
  }

  return data;
};

export type GetPromptByIdResult = Awaited<ReturnType<typeof getPromptById>>;

/**
 * Fetch prompt versions for a specific prompt
 */
export const getPromptVersions = async (promptId: number) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompt_versions')
    .select('*')
    .eq('prompt_id', promptId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching prompt versions:', error);
    return [];
  }

  return data;
};

/**
 * Fetch a specific prompt version by ID
 */
export const getPromptVersionById = async (versionId: number) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompt_versions')
    .select('*')
    .eq('id', versionId)
    .single();

  if (error) {
    console.error('Error fetching prompt version:', error);
    return null;
  }

  return data;
};

/**
 * Fetch variables for a specific prompt version
 */
export const getPromptVariables = async (versionId: number) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompt_variables')
    .select('*')
    .eq('prompt_version_id', versionId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching prompt variables:', error);
    return [];
  }

  return data;
};

type PromptVariable = Database['public']['Tables']['prompt_variables']['Row'];

export const getMissingVariables = (
  variables: PromptVariable[],
  variablesToCheck: Record<string, string | number | boolean>
) => {
  // return variables.filter((v) => v.required && !(v.name in variablesToCheck));
  const missingVariables = variables
    .filter((v) => v.required)
    .filter((v) => !(v.name in variablesToCheck))
    .map((v) => v.name);

  return missingVariables;
};

export const compilePrompt = (
  promptContent: string,
  variables: Record<string, string | number | boolean>
) => {
  nunjucks.configure({ autoescape: false });

  return nunjucks.renderString(promptContent, variables);
};

type PromptConfig = {
  models: string[];
  temperature: number;
};

type RunPromptOptions = {
  apiKey: string;
  prompt: NonNullable<GetPromptByIdResult>;
  targetVersion: NonNullable<GetLatestPromptVersionResult>;
  variables: Record<string, string | number | boolean>;
  alternateClient?: SupabaseClient;
};

export const runPrompt = async (options: RunPromptOptions) => {
  const { apiKey, prompt, targetVersion, variables, alternateClient } = options;

  const compiledPrompt = compilePrompt(targetVersion.content, variables);

  // Create a log entry before making the API call
  const rawInput: OpenrouterRequestBody = {
    messages: [{ role: 'user', content: compiledPrompt }],
    models:
      process.env.FREE_MODELS_ONLY === 'true'
        ? FREE_MODELS.sort(() => 0.5 - Math.random()).slice(
            0,
            MAX_OPENROUTER_MODELS
          )
        : ((targetVersion.config as PromptConfig)?.models ?? [
            DEFAULT_OPENROUTER_MODEL,
          ]),
  };

  const logEntry = await createLogEntry(
    prompt.projects.id,
    targetVersion.id,
    variables,
    rawInput,
    alternateClient
  );

  if (!logEntry) {
    throw new Error('Failed to create log entry');
  }

  try {
    const response = await fetch(OPENROUTER_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...OPENROUTER_HEADERS,
      },
      body: JSON.stringify(rawInput),
    });

    const completion = await response.json();

    // Update the log entry with the completion data
    await updateLogWithCompletion(logEntry.uuid, completion, alternateClient);

    return { completion, logUuid: logEntry.uuid };
  } catch (error) {
    console.error(error);

    // In case of error, still update the log but with the error information
    await updateLogWithCompletion(
      logEntry.uuid,
      { error: String(error) },
      alternateClient
    );

    throw new Error('Error calling OpenRouter API');
  }
};

/**
 * Fetch a specific prompt version by UUID
 */
export const getPromptVersionByUuid = async (
  versionUuid: string,
  alternateClient?: SupabaseClient
) => {
  const supabase = alternateClient ?? (await createClient());

  const { data: versionData, error: versionError } = await supabase
    .from('prompt_versions')
    .select(
      '*, prompt_variables(*), prompts(*, projects(id, uuid, organizations(id, uuid)))'
    )
    .eq('uuid', versionUuid)
    .single();

  if (versionError) {
    console.error('Error fetching prompt version:', versionError);
    return null;
  }

  return versionData;
};

export type GetPromptVersionByUuidResult = Awaited<
  ReturnType<typeof getPromptVersionByUuid>
>;
