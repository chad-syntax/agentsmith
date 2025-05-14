'use client';

import Link from 'next/link';
import { useState } from 'react';
import { IconChevronRight, IconPlayerPlay } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { routes } from '@/utils/routes';
import { useApp } from '@/app/providers/app';
import { PromptContentEditor } from '@/components/editors/PromptContentEditor';
import { VariablesSidebar } from '@/components/prompt/VariablesSidebar';
import { PromptTestModal } from '@/components/prompt/PromptTestModal';
import { createDraftVersion } from '@/app/actions/prompts';
import { CreateVersionModal } from '@/components/prompt/CreateVersionModal';
import { compareSemanticVersions } from '@/utils/versioning';
import { Button } from '@/components/ui/button';
import { H1 } from '@/components/typography';
import {
  GetPromptByIdResult,
  GetAllPromptVersionsResult,
  GetLatestPromptVersionResult,
} from '@/lib/PromptsService';

type PromptDetailPageProps = {
  prompt: NonNullable<GetPromptByIdResult>;
  latestVersion: NonNullable<GetLatestPromptVersionResult>;
  allVersions: NonNullable<GetAllPromptVersionsResult>;
};

export const PromptDetailPage = (props: PromptDetailPageProps) => {
  const { prompt, latestVersion, allVersions } = props;

  const { selectedProjectUuid } = useApp();
  const router = useRouter();
  const [expandedVersions, setExpandedVersions] = useState<Record<number, boolean>>({
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

  const handleCreateNewVersion = () => {
    setIsCreatingVersion(true);
  };

  const handleVersionSubmit = async (customVersion: string) => {
    setIsCreatingVersion(false);

    try {
      const { versionUuid } = await createDraftVersion({
        promptId: prompt.id,
        latestVersion: latestVersion.version,
        customVersion,
      });

      // Redirect to the edit page for the new draft version
      router.push(routes.studio.editPromptVersion(selectedProjectUuid, versionUuid));
    } catch (error) {
      console.error('Error creating new version:', error);
      alert('Failed to create new version. Please try again.');
    }
  };

  // Find the highest version number across all versions
  const getHighestVersion = () => {
    if (!allVersions || allVersions.length === 0) return latestVersion.version;

    return allVersions.reduce((highest, current) => {
      return compareSemanticVersions(current.version, highest) > 0 ? current.version : highest;
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
            <H1>{prompt.name}</H1>
            <div className="space-x-4">
              <Button
                onClick={() => setIsTestModalOpen(true)}
                className="bg-green-500 hover:bg-green-600 flex items-center gap-2"
              >
                <IconPlayerPlay size={16} />
                Test Run
              </Button>
              <Button onClick={handleCreateNewVersion} disabled={isCreatingVersion}>
                {isCreatingVersion ? 'Creating...' : 'New Version'}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {allVersions.map((version) => (
              <div key={version.id} className="bg-background rounded-lg border">
                <Button
                  onClick={() => handleVersionToggle(version.id)}
                  variant="ghost"
                  className="w-full px-4 py-3 flex justify-between items-center hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    <IconChevronRight
                      className={`w-5 h-5 transition-transform ${
                        expandedVersions[version.id] ? 'transform rotate-90' : ''
                      }`}
                    />
                    <span className="font-medium">Version {version.version}</span>
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
                    <Button variant="link" asChild className="p-0">
                      <Link
                        href={routes.studio.editPromptVersion(selectedProjectUuid, version.uuid)}
                      >
                        Edit
                      </Link>
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {new Date(version.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Button>
                {expandedVersions[version.id] && (
                  <div className="px-4 pb-4">
                    <PromptContentEditor
                      content={version.content}
                      onContentChange={() => {}}
                      readOnly
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <VariablesSidebar
        globalContext={prompt.projects.global_contexts?.content ?? {}}
        variables={latestVersion.prompt_variables}
        readOnly
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
