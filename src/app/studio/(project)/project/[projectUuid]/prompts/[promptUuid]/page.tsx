import {
  getPromptById,
  getLatestPromptVersion,
  getPromptVersions,
} from '@/lib/prompts';
import { PromptDetailPage } from '@/page-components/PromptDetailPage';
import { notFound } from 'next/navigation';

type PromptDetailProps = {
  params: Promise<{ promptUuid: string }>;
};

export default async function PromptDetail(props: PromptDetailProps) {
  const { promptUuid } = await props.params;

  // Fetch prompt data from Supabase
  const prompt = await getPromptById(promptUuid);

  if (!prompt) {
    return notFound();
  }

  // Get the latest version
  const latestVersion = await getLatestPromptVersion(prompt.id);

  if (!latestVersion) {
    return notFound();
  }

  // Get all versions
  const allVersions = await getPromptVersions(prompt.id);

  return (
    <PromptDetailPage
      prompt={prompt}
      latestVersion={latestVersion}
      allVersions={allVersions}
    />
  );
}
