'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { routes } from '@/utils/routes';
import { Database } from '@/app/__generated__/supabase.types';

type ProjectEditPageProps = {
  projectData: Database['public']['Tables']['projects']['Row'];
};

export const ProjectEditPage = (props: ProjectEditPageProps) => {
  const { projectData } = props;
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
          : 'An error occurred while saving'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-8">Edit Project</h1>

      <div className="max-w-lg">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter project name"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>

          <Link
            href={routes.studio.project(projectData.uuid)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
};
