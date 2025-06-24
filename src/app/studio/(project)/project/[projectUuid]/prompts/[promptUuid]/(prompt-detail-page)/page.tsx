import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { PromptDetailPage } from '@/page-components/PromptDetailPage';
import { notFound } from 'next/navigation';

type PromptDetailProps = {
  params: Promise<{ promptUuid: string }>;
};

export default async function PromptDetail(props: PromptDetailProps) {
  const { promptUuid } = await props.params;

  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  // Fetch prompt data from Supabase
  const prompt = await agentsmith.services.prompts.getPromptByUuid(promptUuid);

  if (!prompt) {
    return notFound();
  }

  // Get all versions
  const allVersions = await agentsmith.services.prompts.getPromptVersions(
    prompt.id
  );

  // Get the latest version
  const latestVersion =
    await agentsmith.services.prompts.getLatestPromptVersion(prompt.id);

  if (!latestVersion) {
    return notFound();
  }

  return (
    <PromptDetailPage
      prompt={prompt}
      latestVersion={latestVersion}
      allVersions={allVersions}
    />
  );
}
