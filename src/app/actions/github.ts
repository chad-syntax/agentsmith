'use server';

import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { routes } from '@/utils/routes';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ActionResponse } from '@/types/action-response';
import { createErrorResponse, createSuccessResponse } from '@/utils/action-helpers';
import type { SyncResult } from '@/lib/GitHubSyncService';

export const installGithubApp = async (organizationUuid: string) => {
  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  const { uuid: installationRecordUuid } =
    await agentsmith.services.githubApp.createAppInstallationRecord(organizationUuid);

  const installUrl = agentsmith.services.githubApp.getInstallationUrl({
    organizationUuid,
    installationRecordUuid,
  });

  redirect(installUrl);
};

export const syncProject = async (projectUuid: string): Promise<ActionResponse<SyncResult>> => {
  const supabase = await createClient();

  const { services, logger } = new AgentsmithServices({ supabase });

  logger.info('calling syncProject action with projectUuid', projectUuid);

  try {
    const project = await services.projects.getProjectDataByUuid(projectUuid);

    if (!project) {
      return createErrorResponse(`Project with uuid ${projectUuid} not found, cannot sync project`);
    }

    const projectRepository = await services.projects.getProjectRepositoryByProjectId(project.id);

    if (!projectRepository) {
      return createErrorResponse(
        `Project repository for project ${project.id} not found, cannot sync project`,
      );
    }

    revalidatePath(routes.studio.home);

    const result = await services.githubSync.sync({
      projectRepository,
      source: 'agentsmith',
    });

    return createSuccessResponse(result, 'Project synced successfully.');
  } catch (error) {
    logger.error(error, 'Error syncing project:');
    return createErrorResponse(error instanceof Error ? error.message : 'Failed to sync project');
  }
};
