import { getProjectData } from '@/lib/projects';
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

  const projectData = await getProjectData(projectUuid);

  if (!projectData) {
    redirect(routes.studio.home);
  }

  return <ProjectEditPage projectData={projectData} />;
}
