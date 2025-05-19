'use server';

import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

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

export const syncProject = async (projectUuid: string) => {
  const supabase = await createClient();

  const { services, logger } = new AgentsmithServices({ supabase });

  logger.info('calling syncProject action with projectUuid', projectUuid);

  const project = await services.projects.getProjectDataByUuid(projectUuid);

  if (!project) {
    throw new Error(`Project with uuid ${projectUuid} not found, cannot sync project`);
  }

  const projectRepository = await services.projects.getProjectRepositoryByProjectId(project.id);

  if (!projectRepository) {
    throw new Error(`Project repository for project ${project.id} not found, cannot sync project`);
  }

  await services.githubSync.sync({
    projectRepository,
    source: 'agentsmith',
  });
};
