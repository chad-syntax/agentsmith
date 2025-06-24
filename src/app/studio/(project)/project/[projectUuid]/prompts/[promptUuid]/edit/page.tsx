import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { PromptEditPage } from '@/page-components/PromptEditPage';
import { notFound } from 'next/navigation';

type PromptEditPageProps = {
  params: Promise<{ promptUuid: string }>;
};

export default async function PromptEdit(props: PromptEditPageProps) {
  const { promptUuid } = await props.params;

  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  // Fetch prompt data from Supabase
  const prompt = await agentsmith.services.prompts.getPromptByUuid(promptUuid);

  if (!prompt) {
    return notFound();
  }

  return <PromptEditPage prompt={prompt} />;
}
