import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { PromptDetailPage } from '@/page-components/PromptDetailPage';
import { PromptPageProvider } from '@/providers/prompt-page';
import { notFound } from 'next/navigation';

type PromptDetailProps = {
  params: Promise<{ projectUuid: string; promptUuid: string }>;
};

export default async function PromptDetail(props: PromptDetailProps) {
  const { projectUuid, promptUuid } = await props.params;

  const supabase = await createClient();
  const agentsmith = new AgentsmithServices({ supabase });
  const project = await agentsmith.services.projects.getProjectDataByUuid(projectUuid);

  if (!project) {
    return notFound();
  }

  const allPrompts = await agentsmith.services.prompts.getAllPromptsData(project.id);

  const promptData = allPrompts?.find((p) => p.uuid === promptUuid);

  if (!promptData) {
    return notFound();
  }

  const versionsData = promptData.prompt_versions;
  const globalContext = (project.global_contexts?.content as Record<string, any> | null) ?? {};

  return (
    <PromptPageProvider
      prompt={promptData}
      versions={versionsData}
      mode="view"
      globalContext={globalContext}
    >
      <PromptDetailPage />
    </PromptPageProvider>
  );
}
