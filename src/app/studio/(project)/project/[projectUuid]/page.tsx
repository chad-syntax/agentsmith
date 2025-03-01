import { getProjectData } from '@/lib/projects';
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

  const projectData = await getProjectData(projectUuid);

  if (!projectData) {
    redirect(routes.studio.home);
  }

  return <ProjectPage projectData={projectData} />;
}
