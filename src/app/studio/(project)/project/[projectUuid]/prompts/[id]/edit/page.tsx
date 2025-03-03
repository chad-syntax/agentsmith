import { getPromptById, getLatestPromptVersion } from '@/lib/prompts';
import { PromptEditPage } from '@/page-components/PromptEditPage';
import { notFound } from 'next/navigation';

type PromptEditProps = {
  params: Promise<{ id: string }>;
};

export default async function PromptEdit(props: PromptEditProps) {
  const { params } = props;

  const { id: promptId } = await params;

  // Fetch prompt data from Supabase
  const prompt = await getPromptById(promptId);

  if (!prompt) {
    return notFound();
  }

  // Get the latest version
  const latestVersion = await getLatestPromptVersion(prompt.id);

  if (!latestVersion) {
    return notFound();
  }

  return (
    <PromptEditPage
      prompt={prompt}
      initialContent={latestVersion.content}
      initialModel={(latestVersion.config as any)?.model}
      initialVariables={latestVersion.prompt_variables}
    />
  );
}
