'use server';

import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { routes } from '@/utils/routes';
import { ActionResponse } from '@/types/action-response';
import { createErrorResponse, createSuccessResponse } from '@/utils/action-helpers';

type ConnectProjectOptions = {
  projectUuid: string;
  projectRepositoryId: number;
  agentsmithFolder?: string;
  organizationUuid: string;
};

export async function connectProject(options: ConnectProjectOptions): Promise<ActionResponse> {
  const { projectUuid, projectRepositoryId, agentsmithFolder, organizationUuid } = options;

  const supabase = await createClient();
  const agentsmith = new AgentsmithServices({ supabase });

  try {
    const project = await agentsmith.services.projects.getProjectDataByUuid(projectUuid);

    if (!project) {
      return createErrorResponse('Project not found, cannot connect project to repository');
    }

    await agentsmith.services.githubApp.connectProjectRepository({
      projectId: project.id,
      projectUuid,
      agentsmithFolder,
      projectRepositoryId,
    });

    revalidatePath(routes.studio.organization(organizationUuid));
    return createSuccessResponse(undefined, 'Project connected successfully.');
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to connect project',
    );
  }
}
