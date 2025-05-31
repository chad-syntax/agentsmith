'use server';

import { createClient } from '@/lib/supabase/server';
import { ActionResponse } from '@/types/action-response';
import { createErrorResponse, createSuccessResponse } from '@/utils/action-helpers';
import { AgentsmithServices } from '@/lib/AgentsmithServices';

export async function generateTypes(
  projectId: number,
): Promise<ActionResponse<{ content: string; filename: string }>> {
  const supabase = await createClient();
  const { services, logger } = new AgentsmithServices({ supabase });
  try {
    const content = await services.typegen.generateTypes({ projectId });
    return createSuccessResponse({ content, filename: 'agentsmith.types.ts' });
  } catch (error) {
    logger.error('Failed to generate types', { error });
    return createErrorResponse(
      'Failed to generate types',
      error instanceof Error ? { message: [error.message] } : { message: ['Unknown error'] },
    );
  }
}
