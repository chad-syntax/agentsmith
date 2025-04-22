'use server';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/app/__generated__/supabase.types';
import { compareSemanticVersions, incrementVersion } from '@/utils/versioning';
import { SEMVER_PATTERN } from '@/app/constants';
import { DEFAULT_OPENROUTER_CONFIG, CompletionConfig } from '@/lib/openrouter';

type CreatePromptVersionOptions = {
  promptId: number;
  content: string;
  config: CompletionConfig;
  version: string;
  status: Database['public']['Enums']['prompt_status'];
  variables: Array<{
    name: string;
    type: Database['public']['Enums']['variable_type'];
    required: boolean;
  }>;
};

export async function createPromptVersion(options: CreatePromptVersionOptions) {
  const { promptId, content, config, version, status, variables } = options;
  const supabase = await createClient();

  try {
    // Create a new version
    const { data: versionData, error: versionError } = await supabase
      .from('prompt_versions')
      .insert({
        prompt_id: promptId,
        content,
        config: config as any,
        status,
        version,
      })
      .select('id')
      .single();

    if (versionError || !versionData) {
      throw new Error('Failed to create prompt version: ' + versionError?.message);
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
        throw new Error('Failed to create prompt variables: ' + variablesError.message);
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
  config: CompletionConfig;
  status: Database['public']['Enums']['prompt_status'];
  variables: Array<{
    id?: number;
    name: string;
    type: Database['public']['Enums']['variable_type'];
    required: boolean;
  }>;
};

export async function updatePromptVersion(options: UpdatePromptVersionOptions) {
  const { promptVersionUuid, content, config, status, variables } = options;
  const supabase = await createClient();

  try {
    // Get the prompt version ID from UUID
    const { data: versionData, error: getVersionError } = await supabase
      .from('prompt_versions')
      .select('id')
      .eq('uuid', promptVersionUuid)
      .single();

    if (getVersionError || !versionData) {
      throw new Error('Failed to find prompt version: ' + getVersionError?.message);
    }

    const promptVersionId = versionData.id;

    // Update the version
    const { error: versionError } = await supabase
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

    // Get existing variables
    const { data: existingVariables, error: getVariablesError } = await supabase
      .from('prompt_variables')
      .select('id')
      .eq('prompt_version_id', promptVersionId);

    if (getVariablesError) {
      throw new Error('Failed to fetch existing variables: ' + getVariablesError.message);
    }

    // Delete existing variables
    if (existingVariables.length > 0) {
      const { error: deleteError } = await supabase
        .from('prompt_variables')
        .delete()
        .eq('prompt_version_id', promptVersionId);

      if (deleteError) {
        throw new Error('Failed to delete existing variables: ' + deleteError.message);
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
        throw new Error('Failed to create prompt variables: ' + variablesError.message);
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
  config: CompletionConfig;
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
        config: config as any,
        status: 'PUBLISHED',
        version: '0.0.1',
      })
      .select('id')
      .single();

    if (versionError || !versionData) {
      // If we failed to create a version, delete the prompt to avoid orphans
      await supabase.from('prompts').delete().eq('id', newPromptId);
      throw new Error('Failed to create prompt version: ' + versionError?.message);
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
        throw new Error('Failed to create prompt variables: ' + variablesError.message);
      }
    }

    return { promptId: newPromptId, promptUuid: newPromptUuid };
  } catch (error) {
    console.error('Error creating prompt:', error);
    throw error;
  }
}

type CreatePromptWithDraftVersionOptions = {
  name: string;
  projectId: number;
};

export async function createPromptWithDraftVersion(options: CreatePromptWithDraftVersionOptions) {
  const { name, projectId } = options;
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

    // Create a new draft version
    const { data: versionData, error: versionError } = await supabase
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
      await supabase.from('prompts').delete().eq('id', newPromptId);
      throw new Error('Failed to create prompt version: ' + versionError?.message);
    }

    return {
      promptUuid: newPromptUuid,
      versionUuid: versionData.uuid,
    };
  } catch (error) {
    console.error('Error creating prompt with draft version:', error);
    throw error;
  }
}

type CreateDraftVersionOptions = {
  promptId: number;
  latestVersion: string;
  customVersion?: string;
  versionType?: 'major' | 'minor' | 'patch';
};

export async function createDraftVersion(options: CreateDraftVersionOptions) {
  const { promptId, latestVersion, customVersion, versionType = 'patch' } = options;
  const supabase = await createClient();

  try {
    // First, get ALL versions for this prompt to find existing versions
    const { data: allVersions, error: versionsError } = await supabase
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
    const { data: latestVersionData, error: latestVersionError } = await supabase
      .from('prompt_versions')
      .select('content, config, prompt_variables(*)')
      .eq('prompt_id', promptId)
      .eq('version', latestVersion)
      .single();

    if (latestVersionError || !latestVersionData) {
      throw new Error('Failed to find latest version: ' + latestVersionError?.message);
    }

    console.log(
      'will create new draft version with content and config of',
      latestVersionData.content,
      latestVersionData.config,
    );

    // Create new draft version
    const { data: newVersionData, error: newVersionError } = await supabase
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
      const variablesToInsert = latestVersionData.prompt_variables.map((variable: any) => ({
        prompt_version_id: newVersionData.id,
        name: variable.name,
        type: variable.type,
        required: variable.required,
      }));

      const { error: variablesError } = await supabase
        .from('prompt_variables')
        .insert(variablesToInsert);

      if (variablesError) {
        throw new Error('Failed to copy prompt variables: ' + variablesError.message);
      }
    }

    return { versionUuid: newVersionData.uuid };
  } catch (error) {
    console.error('Error creating draft version:', error);
    throw error;
  }
}
