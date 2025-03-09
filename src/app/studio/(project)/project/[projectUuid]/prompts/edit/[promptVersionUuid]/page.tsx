import { EditPromptVersionPage } from '@/page-components/EditPromptVersionPage';
import { notFound } from 'next/navigation';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';

type EditPromptVersionProps = {
  params: Promise<{
    promptVersionUuid: string;
  }>;
};

export default async function EditPromptVersion(props: EditPromptVersionProps) {
  const { promptVersionUuid } = await props.params;

  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  // Fetch prompt version data from Supabase
  const promptVersion =
    await agentsmith.services.prompts.getPromptVersionByUuid(promptVersionUuid);

  if (!promptVersion) {
    return notFound();
  }

  return <EditPromptVersionPage promptVersion={promptVersion} />;
}
