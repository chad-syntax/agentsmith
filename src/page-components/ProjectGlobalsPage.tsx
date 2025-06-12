'use client';

import { updateProjectGlobals } from '@/app/actions/project-globals';
import { useApp } from '@/providers/app';
import { JsonEditor } from '@/components/editors/json-editor';
import { H1 } from '@/components/typography';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { GetProjectGlobalsResult } from '@/lib/ProjectsService';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

type ProjectGlobalsPageProps = {
  projectUuid: string;
  projectGlobals: GetProjectGlobalsResult;
};

export const ProjectGlobalsPage = (props: ProjectGlobalsPageProps) => {
  const { projectUuid, projectGlobals } = props;

  const { showSyncTooltip } = useApp();

  const [globals, setGlobals] = useState<any>(projectGlobals?.content ?? {});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSaving(true);
    setError(null);

    try {
      const result = await updateProjectGlobals({
        projectUuid,
        globals,
      });

      if (!result.success) {
        setError(result.message ?? 'Something went wrong saving globals');
      } else {
        showSyncTooltip();
      }
    } catch (error: any) {
      console.error(error);
      setError('Failed to save globals: ' + error?.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <H1 className="mb-4">Project Globals</H1>
      <form onSubmit={handleSubmit}>
        <JsonEditor
          value={globals}
          onChange={(value) => {
            setGlobals(value);
          }}
          className="pb-4"
        />
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </form>
    </div>
  );
};
