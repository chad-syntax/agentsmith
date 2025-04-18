import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { ProjectEditPage } from '@/page-components/ProjectEditPage';
import { redirect } from 'next/navigation';
import { routes } from '@/utils/routes';

type ProjectEditPageProps = {
  params: Promise<{
    projectUuid: string;
  }>;
};

export default async function ProjectEdit(props: ProjectEditPageProps) {
  const { projectUuid } = await props.params;

  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  const projectData = await agentsmith.services.projects.getProjectData(projectUuid);

  if (!projectData) {
    redirect(routes.studio.home);
  }

  const githubAppInstallation = await agentsmith.services.github.getActiveInstallation(
    projectData.organization_id,
  );

  return (
    <ProjectEditPage projectData={projectData} githubAppInstallation={githubAppInstallation} />
  );
}
