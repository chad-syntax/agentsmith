import { PromptsPage } from '@/page-components/PromptsPage';
import { getFirstProject } from '@/lib/projects';
import { getPromptsByProjectId } from '@/lib/prompts';

export default async function PromptsPageWrapper() {
  // Get the first project
  const project = await getFirstProject();

  // If no project exists, return empty prompts
  if (!project) {
    return <PromptsPage prompts={[]} />;
  }

  // Fetch prompts for the project
  const prompts = await getPromptsByProjectId(project.id);

  return <PromptsPage prompts={prompts} />;
}
