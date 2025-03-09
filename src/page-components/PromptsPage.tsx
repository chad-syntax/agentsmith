'use client';

import Link from 'next/link';
import { useState } from 'react';
import { generateTypes } from '@/app/actions/generate-types';
import { routes } from '@/utils/routes';
import { useApp } from '@/app/providers/app';
import { CreatePromptModal } from '@/components/prompt/CreatePromptModal';
import { compareSemanticVersions } from '@/utils/versioning';
import { Button } from '@/components/ui/button';
import { H1, H2, H3, P } from '@/components/typography';
import { GetPromptsByProjectIdResult } from '@/lib/PromptsService';

type PromptsPageProps = {
  prompts: NonNullable<GetPromptsByProjectIdResult>;
  projectId: number;
};

export const PromptsPage = (props: PromptsPageProps) => {
  const { prompts, projectId } = props;
  const { selectedProjectUuid } = useApp();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
        <H1>Prompts Library</H1>
        <div className="space-x-4">
          <Button onClick={handleGenerateTypes} variant="outline">
            Generate Types
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            Create New Prompt
          </Button>
        </div>
      </div>

      {prompts.length === 0 ? (
        <div className="text-center py-12">
          <P className="text-muted-foreground mb-4">No prompts found</P>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            Create Your First Prompt
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prompts.map((prompt) => {
            // First, get all published versions
            const publishedVersions = prompt.prompt_versions.filter(
              (v) => v.status === 'PUBLISHED'
            );

            // Sort published versions by semantic version (newest first)
            const sortedPublishedVersions = [...publishedVersions].sort(
              (a, b) => compareSemanticVersions(b.version, a.version)
            );

            // If there are no published versions, get the latest draft
            let latestVersion;
            if (sortedPublishedVersions.length > 0) {
              latestVersion = sortedPublishedVersions[0];
            } else {
              // Get all draft versions
              const draftVersions = prompt.prompt_versions.filter(
                (v) => v.status === 'DRAFT'
              );

              // Sort draft versions by semantic version (newest first)
              const sortedDraftVersions = [...draftVersions].sort((a, b) =>
                compareSemanticVersions(b.version, a.version)
              );

              latestVersion = sortedDraftVersions[0];
            }

            // Get required variables
            const requiredVariables =
              latestVersion?.prompt_variables.filter((v) => v.required) || [];

            return (
              <div
                key={prompt.uuid}
                className="bg-background rounded-lg border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <H2>{prompt.name}</H2>
                  <Button variant="link" asChild className="p-0">
                    <Link
                      href={routes.studio.promptDetail(
                        selectedProjectUuid,
                        prompt.uuid
                      )}
                    >
                      View Details
                    </Link>
                  </Button>
                </div>
                <div className="mb-4">
                  <P className="text-muted-foreground line-clamp-3">
                    {latestVersion?.content}
                  </P>
                </div>
                {requiredVariables.length > 0 && (
                  <div className="mb-4">
                    <H3 className="text-muted-foreground mb-2">
                      Required Variables:
                    </H3>
                    <div className="flex flex-wrap gap-2">
                      {requiredVariables.map((variable) => (
                        <span
                          key={variable.id}
                          className="px-2 py-1 bg-muted rounded-md text-xs"
                        >
                          {variable.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      v{latestVersion?.version || '0.0.0'}
                    </span>
                    {latestVersion?.status && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          latestVersion.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {latestVersion.status}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {latestVersion
                      ? new Date(latestVersion.created_at).toLocaleDateString()
                      : 'No versions yet'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreatePromptModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projectId={projectId}
      />
    </div>
  );
};
