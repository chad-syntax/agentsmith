import { getPromptVersionByUuid } from '@/lib/prompts';
import { EditPromptVersionPage } from '@/page-components/EditPromptVersionPage';
import { notFound } from 'next/navigation';

type EditPromptVersionProps = {
  params: Promise<{
    promptVersionUuid: string;
  }>;
};

export default async function EditPromptVersion(props: EditPromptVersionProps) {
  const { promptVersionUuid } = await props.params;

  // Fetch prompt version data from Supabase
  const promptVersion = await getPromptVersionByUuid(promptVersionUuid);

  if (!promptVersion) {
    return notFound();
  }

  return <EditPromptVersionPage promptVersion={promptVersion} />;
}
