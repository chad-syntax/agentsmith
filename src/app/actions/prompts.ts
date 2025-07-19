'use server';

import { createClient } from '@/lib/supabase/server';
import {
  CreateDraftVersionOptions,
  CreatePromptWithDraftVersionOptions,
  UpdatePromptVersionOptions,
} from '@/lib/PromptsService';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { ActionResponse } from '@/types/action-response';
import { createErrorResponse, createSuccessResponse } from '@/utils/action-helpers';
import { revalidatePath } from 'next/cache';

export async function updatePromptVersion(
  options: UpdatePromptVersionOptions,
): Promise<ActionResponse<undefined>> {
  const supabase = await createClient();
  const { services, logger } = new AgentsmithServices({ supabase });

  try {
    await services.prompts.updatePromptVersion(options);

    // revalidate the prompt detail page and edit version page
    revalidatePath(
      `/studio/project/${options.projectUuid}/prompts/${options.promptVersionUuid}`,
      'page',
    );
    revalidatePath(
      `/studio/project/${options.projectUuid}/prompts/edit/${options.promptVersionUuid}`,
      'page',
    );

    return createSuccessResponse(undefined, 'Prompt version updated successfully.');
  } catch (error) {
    logger.error('Error updating prompt version:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to update prompt version',
    );
  }
}

export async function createPromptWithDraftVersion(
  options: CreatePromptWithDraftVersionOptions,
): Promise<ActionResponse<{ promptUuid: string; versionUuid: string }>> {
  const supabase = await createClient();
  const { services, logger } = new AgentsmithServices({ supabase });

  try {
    const result = await services.prompts.createPromptWithDraftVersion(options);
    return createSuccessResponse(result, 'Prompt with draft version created successfully.');
  } catch (error) {
    logger.error('Error creating prompt with draft version:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to create prompt with draft version',
    );
  }
}

export async function createDraftVersion(
  options: CreateDraftVersionOptions,
): Promise<ActionResponse<{ versionUuid: string }>> {
  const supabase = await createClient();
  const { services, logger } = new AgentsmithServices({ supabase });

  try {
    const result = await services.prompts.createDraftVersion(options);
    return createSuccessResponse(result, 'Draft version created successfully.');
  } catch (error) {
    logger.error('Error creating draft version:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to create draft version',
    );
  }
}
