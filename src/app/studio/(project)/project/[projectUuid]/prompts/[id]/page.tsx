import { getPromptById, getLatestPromptVersion } from '@/lib/prompts';
import { PromptDetailPage } from '@/page-components/PromptDetailPage';
import { notFound } from 'next/navigation';

type PromptDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function PromptDetail(props: PromptDetailProps) {
  const { id: promptId } = await props.params;

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

  return <PromptDetailPage prompt={prompt} latestVersion={latestVersion} />;
}
