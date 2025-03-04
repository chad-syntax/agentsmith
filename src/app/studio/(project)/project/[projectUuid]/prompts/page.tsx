import { PromptsPage } from '@/page-components/PromptsPage';
import { getPromptsByProjectId } from '@/lib/prompts';
import { getProjectData } from '@/lib/projects';
import { notFound } from 'next/navigation';

type PromptLibraryProps = {
  params: Promise<{ projectUuid: string }>;
};

export default async function PromptLibrary(props: PromptLibraryProps) {
  const { projectUuid } = await props.params;

  // Get project first to use the ID for getting prompts
  const project = await getProjectData(projectUuid);

  if (!project) {
    return notFound();
  }

  // Fetch prompts for the project
  const prompts = await getPromptsByProjectId(project.id);

  return <PromptsPage prompts={prompts} projectId={project.id} />;
}
