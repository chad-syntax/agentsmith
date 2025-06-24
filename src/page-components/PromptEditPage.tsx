'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { H1 } from '@/components/typography';
import { GetPromptByIdResult } from '@/lib/PromptsService';
import { createClient } from '@/lib/supabase/client';
import { routes } from '@/utils/routes';

type PromptEditProps = {
  prompt: NonNullable<GetPromptByIdResult>;
};

export const PromptEditPage = (props: PromptEditProps) => {
  const { prompt } = props;
  const router = useRouter();

  const [name, setName] = useState(prompt.name);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSave = async () => {
    if (!prompt.uuid) return;
    if (!name.trim()) {
      setError('Prompt name cannot be empty');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('prompts')
        .update({ name })
        .eq('uuid', prompt.uuid);

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!prompt.projects?.uuid) {
        throw new Error('Project UUID not found');
      }

      // Navigate back to prompt page
      router.push(routes.studio.promptDetail(prompt.projects.uuid, prompt.uuid));
    } catch (e) {
      setError(
        typeof e === 'object' && e !== null && 'message' in e
          ? (e.message as string)
          : 'An error occurred while saving',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <H1 className="mb-8">Edit Prompt</H1>

      <div className="max-w-lg">
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">{error}</div>}

        <div className="mb-6">
          <Label htmlFor="promptName" className="mb-2">
            Prompt Name
          </Label>
          <Input
            id="promptName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter prompt name"
          />
        </div>

        <div className="flex gap-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>

          {prompt.projects?.uuid && (
            <Button variant="outline" asChild>
              <Link href={routes.studio.promptDetail(prompt.projects.uuid, prompt.uuid)}>
                Cancel
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export const PromptEditPageSkeleton = () => (
  <div className="p-6">
    <H1 className="mb-8">Edit Prompt</H1>

    <div className="max-w-lg">
      <div className="mb-6">
        <Label htmlFor="promptName" className="mb-2">
          Prompt Name
        </Label>
        <div className="bg-muted rounded w-full h-9 animate-pulse">&nbsp;</div>
      </div>

      <div className="flex gap-4">
        <Button disabled>Save Changes</Button>
        <Button variant="outline" disabled>
          Cancel
        </Button>
      </div>
    </div>
  </div>
);
