'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { routes } from '@/utils/routes';
import { Database } from '@/app/__generated__/supabase.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { H1 } from '@/components/typography';

type ProjectEditPageProps = {
  projectData: Database['public']['Tables']['projects']['Row'];
  githubAppInstallation: Database['public']['Tables']['github_app_installations']['Row'] | null;
};

export const ProjectEditPage = (props: ProjectEditPageProps) => {
  const { projectData, githubAppInstallation } = props;
  const router = useRouter();

  const [name, setName] = useState(projectData.name);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSave = async () => {
    if (!projectData.uuid) return;
    if (!name.trim()) {
      setError('Project name cannot be empty');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ name })
        .eq('uuid', projectData.uuid);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Navigate back to project page
      router.push(routes.studio.project(projectData.uuid));
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
      <H1 className="mb-8">Edit Project</H1>

      <div className="max-w-lg">
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">{error}</div>}

        <div className="mb-6">
          <Label htmlFor="projectName" className="mb-2">
            Project Name
          </Label>
          <Input
            id="projectName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter project name"
          />
        </div>

        {!githubAppInstallation && (
          <div>
            <Label htmlFor="githubAppInstallation">GitHub App Installation</Label>
            <Button>Connect GitHub Repository</Button>
          </div>
        )}

        <div className="flex gap-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>

          <Button variant="outline" asChild>
            <Link href={routes.studio.project(projectData.uuid)}>Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export const ProjectEditPageSkeleton = () => (
  <div className="p-6">
    <H1 className="mb-8">Edit Project</H1>

    <div className="max-w-lg">
      <div className="mb-6">
        <Label htmlFor="projectName" className="mb-2">
          Project Name
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
