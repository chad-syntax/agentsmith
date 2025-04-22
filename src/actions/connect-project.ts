'use server';

import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { routes } from '@/utils/routes';

type ConnectProjectOptions = {
  projectUuid: string;
  projectRepositoryId: number;
  agentsmithFolder?: string;
  organizationUuid: string;
};

export async function connectProject(options: ConnectProjectOptions) {
  const { projectUuid, projectRepositoryId, agentsmithFolder, organizationUuid } = options;

  const supabase = await createClient();
  const agentsmith = new AgentsmithServices({ supabase });

  const project = await agentsmith.services.projects.getProjectData(projectUuid);

  if (!project) {
    throw new Error('Project not found, cannot connect project to repository');
  }

  await agentsmith.services.github.connectProjectRepository({
    projectId: project.id,
    projectUuid,
    agentsmithFolder,
    projectRepositoryId,
  });

  revalidatePath(routes.studio.organization(organizationUuid));
}
