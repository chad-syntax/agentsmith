'use server';

import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';

type ConnectProjectOptions = {
  projectUuid: string;
  projectRepositoryId: number;
  agentsmithFolder?: string;
};

export async function connectProject(options: ConnectProjectOptions) {
  const { projectUuid, projectRepositoryId, agentsmithFolder } = options;

  const supabase = await createClient();
  const agentsmith = new AgentsmithServices({ supabase });

  const project = await agentsmith.services.projects.getProjectData(projectUuid);

  if (!project) {
    throw new Error('Project not found, cannot connect project to repository');
  }

  await agentsmith.services.github.connectProjectRepository({
    projectId: project.id,
    agentsmithFolder,
    projectRepositoryId,
  });
}
