import { PromptsPage } from '@/page-components/PromptsPage';
import { getPromptsByProjectId } from '@/lib/prompts';
import { getProjectData } from '@/lib/projects';
import { redirect } from 'next/navigation';
import { routes } from '@/utils/routes';

type PromptsProps = {
  params: Promise<{
    projectUuid: string;
  }>;
};

export default async function Prompts(props: PromptsProps) {
  const { projectUuid } = await props.params;

  // Get the first project
  const project = await getProjectData(projectUuid);

  if (!project) {
    redirect(routes.studio.home);
  }

  // Fetch prompts for the project
  const prompts = await getPromptsByProjectId(project.id);

  return <PromptsPage prompts={prompts} />;
}
