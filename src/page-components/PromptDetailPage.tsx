'use client';

import Link from 'next/link';
import { useState } from 'react';
import { IconChevronRight, IconPlayerPlay } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { generateTypes } from '@/app/actions/generate-types';
import {
  getPromptById,
  getLatestPromptVersion,
  getPromptVersions,
} from '@/lib/prompts';
import { routes } from '@/utils/routes';
import { useApp } from '@/app/providers/app';
import { PromptContentEditor } from '@/components/editors/PromptContentEditor';
import { VariablesSidebar } from '@/components/prompt/VariablesSidebar';
import { PromptTestModal } from '@/components/prompt/PromptTestModal';
import { createDraftVersion } from '@/app/actions/prompts';
import { CreateVersionModal } from '@/components/prompt/CreateVersionModal';
import { compareSemanticVersions } from '@/utils/versioning';

type PromptDetailPageProps = {
  prompt: NonNullable<Awaited<ReturnType<typeof getPromptById>>>;
  latestVersion: NonNullable<
    Awaited<ReturnType<typeof getLatestPromptVersion>>
  >;
  allVersions: NonNullable<Awaited<ReturnType<typeof getPromptVersions>>>;
};

export const PromptDetailPage = (props: PromptDetailPageProps) => {
  const { prompt, latestVersion, allVersions } = props;
  const { selectedProjectUuid } = useApp();
  const router = useRouter();
  const [expandedVersions, setExpandedVersions] = useState<
    Record<number, boolean>
  >({
    [latestVersion.id]: true,
  });
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);

  const handleVersionToggle = (versionId: number) => {
    setExpandedVersions((prev) => ({
      ...prev,
      [versionId]: !prev[versionId],
    }));
  };

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

  const handleCreateNewVersion = () => {
    setIsCreatingVersion(true);
  };

  const handleVersionSubmit = async (customVersion: string) => {
    setIsCreatingVersion(false);

    try {
      const { versionUuid } = await createDraftVersion({
        promptId: prompt.id,
        promptUuid: prompt.uuid,
        latestVersion: latestVersion.version,
        customVersion,
      });

      // Redirect to the edit page for the new draft version
      router.push(
        routes.studio.editPromptVersion(selectedProjectUuid, versionUuid)
      );
    } catch (error) {
      console.error('Error creating new version:', error);
      alert('Failed to create new version. Please try again.');
    }
  };

  // Find the highest version number across all versions
  const getHighestVersion = () => {
    if (!allVersions || allVersions.length === 0) return latestVersion.version;

    return allVersions.reduce((highest, current) => {
      return compareSemanticVersions(current.version, highest) > 0
        ? current.version
        : highest;
    }, latestVersion.version);
  };

  const highestVersion = getHighestVersion();

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <Link
              href={routes.studio.prompts(selectedProjectUuid)}
              className="text-blue-500 hover:text-blue-600"
            >
              ← Back to Prompts
            </Link>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{prompt.name}</h1>
            <div className="space-x-4">
              <button
                onClick={handleGenerateTypes}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Generate Types
              </button>
              <button
                onClick={() => setIsTestModalOpen(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
              >
                <IconPlayerPlay size={16} />
                Test Run
              </button>
              <button
                onClick={handleCreateNewVersion}
                disabled={isCreatingVersion}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {isCreatingVersion ? 'Creating...' : 'New Version'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {allVersions.map((version) => (
              <div key={version.id} className="bg-white rounded-lg border">
                <button
                  onClick={() => handleVersionToggle(version.id)}
                  className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <IconChevronRight
                      className={`w-5 h-5 transition-transform ${
                        expandedVersions[version.id]
                          ? 'transform rotate-90'
                          : ''
                      }`}
                    />
                    <span className="font-medium">
                      Version {version.version}
                    </span>
                    {version.id === latestVersion.id && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Latest
                      </span>
                    )}
                    {version.status === 'DRAFT' && (
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded ml-2">
                        DRAFT
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <Link
                      href={routes.studio.editPromptVersion(
                        selectedProjectUuid,
                        version.uuid
                      )}
                      className="text-blue-500 hover:text-blue-600"
                    >
                      Edit
                    </Link>
                    <span className="text-sm text-gray-500">
                      {new Date(version.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>
                {expandedVersions[version.id] && (
                  <div className="px-4 pb-4">
                    <PromptContentEditor
                      content={version.content}
                      onContentChange={() => {}}
                      readOnly={true}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <VariablesSidebar
        variables={latestVersion.prompt_variables}
        readOnly={true}
      />

      <PromptTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        variables={latestVersion.prompt_variables}
        promptVersionUuid={latestVersion.uuid}
      />

      <CreateVersionModal
        isOpen={isCreatingVersion}
        onClose={() => setIsCreatingVersion(false)}
        onSubmit={handleVersionSubmit}
        currentVersion={highestVersion}
      />
    </div>
  );
};
