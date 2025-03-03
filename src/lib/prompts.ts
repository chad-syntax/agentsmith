// @ts-ignore needs to be browser version so nextjs can import it
import nunjucks from 'nunjucks/browser/nunjucks';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/app/__generated__/supabase.types';
import { OpenrouterRequestBody } from './openrouter';
import { createLogEntry, updateLogWithCompletion } from './logs';

/**
 * Fetch the latest prompt version for a specific prompt
 */
export const getLatestPromptVersion = async (promptId: number) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompt_versions')
    .select('*, prompt_variables(*)')
    .eq('prompt_id', promptId)
    .eq('status', 'PUBLISHED')
    .order('version', { ascending: true });

  if (error) {
    console.error('Error fetching prompt versions:', error);
    return null;
  }

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
};

export const runPrompt = async (options: RunPromptOptions) => {
  const { apiKey, prompt, targetVersion, variables } = options;

  const compiledPrompt = compilePrompt(targetVersion.content, variables);

  // Create a log entry before making the API call
  const rawInput: OpenrouterRequestBody = {
    messages: [{ role: 'user', content: compiledPrompt }],
    models: (targetVersion.config as PromptConfig)?.models ?? [
      'openrouter/auto',
    ],
  };

  const logEntry = await createLogEntry(
    prompt.projects.id,
    targetVersion.id,
    variables,
    rawInput
  );

  if (!logEntry) {
    throw new Error('Failed to create log entry');
  }

  try {
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://agentsmith.app',
          'X-Title': 'Agentsmith',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rawInput),
      }
    );

    const completion = await response.json();

    // Update the log entry with the completion data
    await updateLogWithCompletion(logEntry.uuid, completion);

    return { completion, logUuid: logEntry.uuid };
  } catch (error) {
    console.error(error);

    // In case of error, still update the log but with the error information
    await updateLogWithCompletion(logEntry.uuid, { error: String(error) });

    throw new Error('Error calling OpenRouter API');
  }
};
