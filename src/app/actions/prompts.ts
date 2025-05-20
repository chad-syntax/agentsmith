'use server';

import { createClient } from '@/lib/supabase/server';
import {
  CreateDraftVersionOptions,
  CreatePromptWithDraftVersionOptions,
  UpdatePromptVersionOptions,
} from '@/lib/PromptsService';
import { AgentsmithServices } from '@/lib/AgentsmithServices';

export async function updatePromptVersion(options: UpdatePromptVersionOptions) {
  const supabase = await createClient();

  const { services, logger } = new AgentsmithServices({ supabase });

  try {
    return await services.prompts.updatePromptVersion(options);
  } catch (error) {
    logger.error('Error updating prompt version:', error);
    throw new Error('Failed to update prompt version');
  }
}

export async function createPromptWithDraftVersion(options: CreatePromptWithDraftVersionOptions) {
  const supabase = await createClient();

  const { services, logger } = new AgentsmithServices({ supabase });

  try {
    return await services.prompts.createPromptWithDraftVersion(options);
  } catch (error) {
    logger.error('Error creating prompt with draft version:', error);
    throw new Error('Failed to create prompt with draft version');
  }
}

export async function createDraftVersion(options: CreateDraftVersionOptions) {
  const supabase = await createClient();

  const { services, logger } = new AgentsmithServices({ supabase });

  try {
    return await services.prompts.createDraftVersion(options);
  } catch (error) {
    logger.error('Error creating draft version:', error);
    throw new Error('Failed to create draft version');
  }
}
