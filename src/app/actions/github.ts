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
  console.log('calling syncProject action with projectUuid', projectUuid);

  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  const project = await agentsmith.services.projects.getProjectDataByUuid(projectUuid);

  if (!project) {
    throw new Error(`Project with uuid ${projectUuid} not found, cannot sync project`);
  }

  await agentsmith.services.githubSync.syncRepositoryFromAgentsmith(project.id);
};
