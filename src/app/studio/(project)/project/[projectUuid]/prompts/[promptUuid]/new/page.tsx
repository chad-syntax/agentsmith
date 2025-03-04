import { getPromptById, getLatestPromptVersion } from '@/lib/prompts';
import { NewPromptVersionPage } from '@/page-components/NewPromptVersionPage';
import { notFound } from 'next/navigation';

type NewPromptVersionProps = {
  params: Promise<{ promptUuid: string }>;
};

export default async function NewPromptVersion(props: NewPromptVersionProps) {
  const { params } = props;

  const { promptUuid } = await params;

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

  return (
    <NewPromptVersionPage
      prompt={prompt}
      initialContent={latestVersion.content}
      initialModel={(latestVersion.config as any)?.model}
      initialVariables={latestVersion.prompt_variables}
      latestVersion={latestVersion.version}
    />
  );
}
