import { PromptsPage } from '@/page-components/PromptsPage';
import { notFound } from 'next/navigation';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';

type PromptLibraryProps = {
  params: Promise<{ projectUuid: string }>;
};

export default async function PromptLibrary(props: PromptLibraryProps) {
  const { projectUuid } = await props.params;

  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  // Get project first to use the ID for getting prompts
  const project =
    await agentsmith.services.projects.getProjectData(projectUuid);

  if (!project) {
    return notFound();
  }

  // Fetch prompts for the project
  const prompts = await agentsmith.services.prompts.getPromptsByProjectId(
    project.id
  );

  return <PromptsPage prompts={prompts} projectId={project.id} />;
}
