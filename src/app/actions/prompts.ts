'use server';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/app/__generated__/supabase.types';

type CreatePromptVersionOptions = {
  promptId: number;
  content: string;
  model: string;
  version: string;
  status: Database['public']['Enums']['prompt_status'];
  variables: Array<{
    name: string;
    type: Database['public']['Enums']['variable_type'];
    required: boolean;
  }>;
};

export async function createPromptVersion(options: CreatePromptVersionOptions) {
  const { promptId, content, model, version, status, variables } = options;
  const supabase = await createClient();

  try {
    // Create a new version
    const { data: versionData, error: versionError } = await supabase
      .from('prompt_versions')
      .insert({
        prompt_id: promptId,
        content,
        config: { model },
        status,
        version,
      })
      .select('id')
      .single();

    if (versionError || !versionData) {
      throw new Error(
        'Failed to create prompt version: ' + versionError?.message
      );
    }

    const newVersionId = versionData.id;

    // Create variables for the new version if there are any
    if (variables.length > 0) {
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
        throw new Error(
          'Failed to create prompt variables: ' + variablesError.message
        );
      }
    }

    return newVersionId;
  } catch (error) {
    console.error('Error creating prompt version:', error);
    throw error;
  }
}

type UpdatePromptVersionOptions = {
  promptVersionUuid: string;
  content: string;
  model: string;
  status: Database['public']['Enums']['prompt_status'];
  variables: Array<{
    id?: number;
    name: string;
    type: Database['public']['Enums']['variable_type'];
    required: boolean;
  }>;
};

export async function updatePromptVersion(options: UpdatePromptVersionOptions) {
  const { promptVersionUuid, content, model, status, variables } = options;
  const supabase = await createClient();

  try {
    // Get the prompt version ID from UUID
    const { data: versionData, error: getVersionError } = await supabase
      .from('prompt_versions')
      .select('id')
      .eq('uuid', promptVersionUuid)
      .single();

    if (getVersionError || !versionData) {
      throw new Error(
        'Failed to find prompt version: ' + getVersionError?.message
      );
    }

    const promptVersionId = versionData.id;

    // Update the version
    const { error: versionError } = await supabase
      .from('prompt_versions')
      .update({
        content,
        config: { model },
        status,
      })
      .eq('uuid', promptVersionUuid);

    if (versionError) {
      throw new Error(
        'Failed to update prompt version: ' + versionError.message
      );
    }

    // Get existing variables
    const { data: existingVariables, error: getVariablesError } = await supabase
      .from('prompt_variables')
      .select('id')
      .eq('prompt_version_id', promptVersionId);

    if (getVariablesError) {
      throw new Error(
        'Failed to fetch existing variables: ' + getVariablesError.message
      );
    }

    // Delete existing variables
    if (existingVariables.length > 0) {
      const { error: deleteError } = await supabase
        .from('prompt_variables')
        .delete()
        .eq('prompt_version_id', promptVersionId);

      if (deleteError) {
        throw new Error(
          'Failed to delete existing variables: ' + deleteError.message
        );
      }
    }

    // Create new variables
    if (variables.length > 0) {
      const variablesToInsert = variables.map((variable) => ({
        prompt_version_id: promptVersionId,
        name: variable.name,
        type: variable.type,
        required: variable.required,
      }));

      const { error: variablesError } = await supabase
        .from('prompt_variables')
        .insert(variablesToInsert);

      if (variablesError) {
        throw new Error(
          'Failed to create prompt variables: ' + variablesError.message
        );
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating prompt version:', error);
    throw error;
  }
}

type CreatePromptOptions = {
  name: string;
  projectId: number;
  content: string;
  config: any;
  variables: Array<{
    name: string;
    type: Database['public']['Enums']['variable_type'];
    required: boolean;
  }>;
};

export async function createPrompt(options: CreatePromptOptions) {
  const { name, projectId, content, config, variables } = options;
  const supabase = await createClient();

  try {
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
      .select('id, uuid')
      .single();

    if (promptError || !promptData) {
      throw new Error('Failed to create prompt: ' + promptError?.message);
    }

    const newPromptId = promptData.id;
    const newPromptUuid = promptData.uuid;

    // Create a new version
    const { data: versionData, error: versionError } = await supabase
      .from('prompt_versions')
      .insert({
        prompt_id: newPromptId,
        content,
        config,
        status: 'PUBLISHED',
        version: '0.0.1',
      })
      .select('id')
      .single();

    if (versionError || !versionData) {
      // If we failed to create a version, delete the prompt to avoid orphans
      await supabase.from('prompts').delete().eq('id', newPromptId);
      throw new Error(
        'Failed to create prompt version: ' + versionError?.message
      );
    }

    const newVersionId = versionData.id;

    // Create variables for the new version if there are any
    if (variables.length > 0) {
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
        throw new Error(
          'Failed to create prompt variables: ' + variablesError.message
        );
      }
    }

    return { promptId: newPromptId, promptUuid: newPromptUuid };
  } catch (error) {
    console.error('Error creating prompt:', error);
    throw error;
  }
}
