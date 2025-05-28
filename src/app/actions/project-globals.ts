'use server';

import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { ActionResponse } from '@/types/action-response';
import { createErrorResponse, createSuccessResponse } from '@/utils/action-helpers';

type UpdateProjectGlobalsOptions = {
  projectUuid: string;
  globals: any;
};

export const updateProjectGlobals = async (
  options: UpdateProjectGlobalsOptions,
): Promise<ActionResponse> => {
  const { projectUuid, globals } = options;

  const supabase = await createClient();

  const { services } = new AgentsmithServices({ supabase });

  try {
    await services.projects.updateProjectGlobals(projectUuid, globals);

    return createSuccessResponse(undefined, 'Project globals updated successfully.');
  } catch (error: any) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to update project globals',
    );
  }
};
