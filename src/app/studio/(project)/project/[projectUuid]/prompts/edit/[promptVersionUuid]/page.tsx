import { EditPromptVersionPage } from '@/page-components/EditPromptVersionPage';
import { notFound } from 'next/navigation';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { PromptPageProvider } from '@/providers/prompt-page';

type EditPromptVersionProps = {
  params: Promise<{
    projectUuid: string;
    promptVersionUuid: string;
  }>;
};

export default async function EditPromptVersion(props: EditPromptVersionProps) {
  const { projectUuid, promptVersionUuid } = await props.params;

  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  const project = await agentsmith.services.projects.getProjectDataByUuid(projectUuid);

  if (!project) {
    return notFound();
  }

  const allPrompts = await agentsmith.services.prompts.getAllPromptsData(project.id);

  const promptData = allPrompts?.find((p) =>
    p.prompt_versions.some((v) => v.uuid === promptVersionUuid),
  );

  if (!promptData) {
    return notFound();
  }

  const versionsData = promptData.prompt_versions;
  const globalContext = (project.global_contexts?.content as Record<string, any> | null) ?? {};

  return (
    <PromptPageProvider
      prompt={promptData}
      versions={versionsData}
      mode="edit"
      currentVersionUuid={promptVersionUuid}
      globalContext={globalContext}
    >
      <EditPromptVersionPage />
    </PromptPageProvider>
  );
}
