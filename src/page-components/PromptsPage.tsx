'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { routes } from '@/utils/routes';
import { useApp } from '@/providers/app';
import { CreatePromptModal } from '@/components/modals/create-prompt';
import { compareSemanticVersions } from '@/utils/versioning';
import { Button } from '@/components/ui/button';
import { H1, H2, H3, P } from '@/components/typography';
import { GetPromptsByProjectIdResult } from '@/lib/PromptsService';
import { DisplayTime } from '@/components/display-time';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';

type PromptsPageProps = {
  prompts: NonNullable<GetPromptsByProjectIdResult>;
  projectId: number;
};

export const PromptsPage = (props: PromptsPageProps) => {
  const { prompts, projectId } = props;
  const { selectedProjectUuid } = useApp();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleEditPromptVersion = (
    e: React.MouseEvent<HTMLButtonElement>,
    promptVersionUuid: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    router.push(routes.studio.editPromptVersion(selectedProjectUuid, promptVersionUuid));
  };

  useEffect(() => {
    if (searchParams.get('openCreateModal')) {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  return (
    <div className="p-6">
      <div className="flex max-md:flex-wrap max-md:gap-4 justify-between items-center mb-6">
        <H1>Prompts Library</H1>
        <div className="space-x-4">
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            New Prompt
          </Button>
        </div>
      </div>

      {prompts.length === 0 ? (
        <div className="text-center py-12">
          <P className="text-muted-foreground mb-4">No prompts found</P>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prompts.map((prompt) => {
            // First, get all published versions
            const publishedVersions = prompt.prompt_versions.filter(
              (v) => v.status === 'PUBLISHED',
            );

            // Sort published versions by semantic version (newest first)
            const sortedPublishedVersions = [...publishedVersions].sort((a, b) =>
              compareSemanticVersions(b.version, a.version),
            );

            // If there are no published versions, get the latest draft
            let latestVersion;
            if (sortedPublishedVersions.length > 0) {
              latestVersion = sortedPublishedVersions[0];
            } else {
              // Get all draft versions
              const draftVersions = prompt.prompt_versions.filter((v) => v.status === 'DRAFT');

              // Sort draft versions by semantic version (newest first)
              const sortedDraftVersions = [...draftVersions].sort((a, b) =>
                compareSemanticVersions(b.version, a.version),
              );

              latestVersion = sortedDraftVersions[0];
            }

            // Get required variables
            const requiredVariables =
              latestVersion?.prompt_variables.filter((v) => v.required) || [];

            return (
              <Link
                key={prompt.uuid}
                href={routes.studio.promptDetail(selectedProjectUuid, prompt.uuid)}
              >
                <div className="bg-background rounded-lg border p-6 hover:shadow-md transition-shadow h-full">
                  <div className="flex justify-between items-start mb-4">
                    <H2 className="hover:text-primary truncate">{prompt.name}</H2>
                  </div>
                  <div className="mb-4">
                    <P className="text-muted-foreground line-clamp-3">{latestVersion?.content}</P>
                  </div>
                  {requiredVariables.length > 0 && (
                    <div className="mb-4">
                      <H3 className="text-muted-foreground mb-2">Required Variables:</H3>
                      <div className="flex flex-wrap gap-2">
                        {requiredVariables.map((variable) => (
                          <span key={variable.id} className="px-2 py-1 bg-muted rounded-md text-xs">
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
                      {latestVersion && (
                        <Button
                          variant="link"
                          onClick={(e) => handleEditPromptVersion(e, latestVersion.uuid)}
                          className="p-0"
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {latestVersion ? (
                        <DisplayTime
                          dateTime={latestVersion.updated_at}
                          formatString="M/d/yy h:mma"
                        />
                      ) : (
                        'No versions yet'
                      )}
                    </span>
                  </div>
                </div>
              </Link>
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

export const PromptsPageSkeleton = () => (
  <div className="p-6">
    <div className="flex justify-between items-center mb-6">
      <H1>Prompts Library</H1>
      <div className="space-x-4">
        <Button disabled>Create New Prompt</Button>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="bg-background rounded-lg border p-6 animate-pulse">
          <div className="flex justify-between items-start mb-4">
            <div className="h-6 bg-muted rounded w-3/4"></div>
          </div>
          <div className="mb-4">
            <div className="h-4 bg-muted rounded w-full mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
          <div className="mb-4">
            <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
            <div className="flex flex-wrap gap-2">
              <div className="h-6 bg-muted rounded w-16"></div>
              <div className="h-6 bg-muted rounded w-20"></div>
              <div className="h-6 bg-muted rounded w-14"></div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 bg-muted rounded w-12"></div>
              <div className="h-5 bg-muted rounded w-16"></div>
            </div>
            <div className="h-4 bg-muted rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
