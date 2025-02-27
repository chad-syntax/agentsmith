import { createClient } from '~/lib/supabase/server';
import { Database } from '@/app/__generated__/supabase.types';

type PromptWithVersionsAndVariables = Awaited<ReturnType<typeof getPromptById>>;

/**
 * Gets a prompt by its UUID
 * @param promptId The UUID of the prompt to fetch
 * @returns The prompt with its versions and variables
 */
export const getPromptById = async (promptId: string) => {
  const supabase = await createClient();

  const { data: prompts, error } = await supabase
    .from('prompts')
    .select(
      `
      id,
      uuid,
      name,
      prompt_versions(
        id,
        content,
        model,
        created_at,
        prompt_variables(
          id,
          name,
          type,
          required
        )
      )
    `
    )
    .eq('uuid', promptId)
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching prompt:', error);
    return null;
  }

  return prompts;
};

/**
 * Gets all prompts for a project
 * @param projectId The ID of the project
 * @returns An array of prompts with their versions and variables
 */
export const getPromptsByProjectId = async (projectId: number) => {
  const supabase = await createClient();

  const { data: prompts, error } = await supabase
    .from('prompts')
    .select(
      `
      *,
      prompt_versions(
        *,
        prompt_variables(*)
      )
    `
    )
    .eq('project_id', projectId);

  if (error) {
    console.error('Error fetching prompts:', error);
    return [];
  }

  return prompts;
};

/**
 * Gets the latest version of a prompt
 * @param promptWithVersions The prompt with its versions
 * @returns The latest version of the prompt
 */
export const getLatestPromptVersion = (
  promptWithVersions: PromptWithVersionsAndVariables
) => {
  if (
    !promptWithVersions ||
    !promptWithVersions.prompt_versions ||
    promptWithVersions.prompt_versions.length === 0
  ) {
    return null;
  }

  // Sort versions by created_at in descending order
  const sortedVersions = [...promptWithVersions.prompt_versions].sort(
    (a, b) =>
      new Date(b.created_at || '').getTime() -
      new Date(a.created_at || '').getTime()
  );

  return sortedVersions[0];
};

/**
 * Creates a new version of a prompt
 * @param options Options for creating the new version
 * @returns The ID of the new version
 */
export const createPromptVersion = async (options: {
  promptId: number;
  content: string;
  model: string;
  variables: Array<{
    name: string;
    type: Database['public']['Enums']['variable_type'];
    required: boolean;
  }>;
}) => {
  const { promptId, content, model, variables } = options;
  const supabase = await createClient();

  // Create a new version
  const { data: versionData, error: versionError } = await supabase
    .from('prompt_versions')
    .insert({
      prompt_id: promptId,
      content,
      model,
      status: 'PUBLISHED',
      version: '1.0', // Default version string
    })
    .select();

  if (versionError || !versionData || versionData.length === 0) {
    console.error('Error creating version:', versionError);
    return null;
  }

  const newVersionId = versionData[0].id;

  // Create variables for the new version
  const variablesToInsert = variables.map((variable) => ({
    prompt_version_id: newVersionId,
    name: variable.name,
    type: variable.type,
    required: variable.required,
  }));

  const { error: variablesError } = await supabase
    .from('prompt_variables')
    .insert(variablesToInsert);

  if (variablesError) {
    console.error('Error creating variables:', variablesError);
    return null;
  }

  return newVersionId;
};

/**
 * Updates a prompt's name
 * @param options Options for updating the prompt
 * @returns Whether the update was successful
 */
export const updatePromptName = async (options: {
  promptUuid: string;
  name: string;
}) => {
  const { promptUuid, name } = options;
  const supabase = await createClient();

  const { error } = await supabase
    .from('prompts')
    .update({ name })
    .eq('uuid', promptUuid);

  if (error) {
    console.error('Error updating prompt name:', error);
    return false;
  }

  return true;
};

/**
 * Creates a new prompt
 * @param options Options for creating the prompt
 * @returns The UUID of the newly created prompt or null if creation failed
 */
export const createPrompt = async (options: {
  name: string;
  projectId: number;
  content: string;
  model: string;
  variables: Array<{
    name: string;
    type: Database['public']['Enums']['variable_type'];
    required: boolean;
  }>;
}) => {
  const { name, projectId, content, model, variables } = options;
  const supabase = await createClient();

  // Generate a slug from the name
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  // Create a new prompt
  const { data: promptData, error: promptError } = await supabase
    .from('prompts')
    .insert({
      name,
      project_id: projectId,
      slug,
    })
    .select();

  if (promptError || !promptData || promptData.length === 0) {
    console.error('Error creating prompt:', promptError);
    return null;
  }

  const newPromptId = promptData[0].id;
  const newPromptUuid = promptData[0].uuid;

  // Create the initial version
  const versionId = await createPromptVersion({
    promptId: newPromptId,
    content,
    model,
    variables,
  });

  if (!versionId) {
    // If we failed to create a version, delete the prompt to avoid orphans
    await supabase.from('prompts').delete().eq('id', newPromptId);
    return null;
  }

  return newPromptUuid;
};
