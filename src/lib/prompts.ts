import { createClient } from '@/lib/supabase/server';

/**
 * Fetch the latest prompt version for a specific prompt
 */
export const getLatestPromptVersion = async (promptId: number) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompt_versions')
    .select('*, prompt_variables(*)')
    .eq('prompt_id', promptId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching prompt versions:', error);
    return null;
  }

  return data[0];
};

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
