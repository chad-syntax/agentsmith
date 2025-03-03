'use client';

import Link from 'next/link';
import { generateTypes } from '@/app/actions/generate-types';
import { getPromptsByProjectId } from '@/lib/prompts';
import { routes } from '@/utils/routes';
import { useApp } from '@/app/providers/app';

type PromptsPageProps = {
  prompts: Awaited<ReturnType<typeof getPromptsByProjectId>>;
};

export const PromptsPage = (props: PromptsPageProps) => {
  const { prompts } = props;
  const { selectedProjectUuid } = useApp();
  const handleGenerateTypes = async () => {
    const response = await generateTypes();
    const blob = new Blob([response.content], { type: 'text/typescript' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = response.filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Prompts Library</h1>
        <div className="space-x-4">
          <button
            onClick={handleGenerateTypes}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Generate Types
          </button>
          <Link
            href={routes.studio.createPrompt(selectedProjectUuid)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Create New Prompt
          </Link>
        </div>
      </div>

      {prompts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No prompts found</p>
          <Link
            href={routes.studio.createPrompt(selectedProjectUuid)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Create Your First Prompt
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prompts.map((prompt) => {
            // Get the latest version
            const sortedVersions = [...prompt.prompt_versions].sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            );
            const latestVersion = sortedVersions[0];

            // Get required variables
            const requiredVariables =
              latestVersion?.prompt_variables.filter((v) => v.required) || [];

            return (
              <div
                key={prompt.uuid}
                className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold">{prompt.name}</h2>
                  <Link
                    href={routes.studio.editPrompt(
                      selectedProjectUuid,
                      prompt.uuid
                    )}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    Edit
                  </Link>
                </div>
                <div className="mb-4">
                  <p className="text-gray-600 line-clamp-3">
                    {latestVersion?.content}
                  </p>
                </div>
                {requiredVariables.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Required Variables:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {requiredVariables.map((variable) => (
                        <span
                          key={variable.id}
                          className="px-2 py-1 bg-gray-100 rounded-md text-xs"
                        >
                          {variable.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Version: {latestVersion?.version || '1.0'}
                  </span>
                  <Link
                    href={routes.studio.promptDetail(
                      selectedProjectUuid,
                      prompt.uuid
                    )}
                    className="text-blue-500 hover:text-blue-600 text-sm"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
