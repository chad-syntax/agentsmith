import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { ProjectPage } from '@/page-components/ProjectPage';
import { routes } from '@/utils/routes';
import { redirect } from 'next/navigation';

type ProjectPageProps = {
  params: Promise<{
    projectUuid: string;
  }>;
};

export default async function Project(props: ProjectPageProps) {
  const { projectUuid } = await props.params;

  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  const { authUser } = await agentsmith.services.users.initialize();

  if (!authUser) {
    redirect(routes.auth.signIn);
  }

  const projectData =
    await agentsmith.services.projects.getProjectData(projectUuid);

  if (!projectData) {
    redirect(routes.error('Project not found'));
  }

  return <ProjectPage projectData={projectData} />;
}
