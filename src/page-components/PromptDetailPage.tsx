'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Play, ClipboardCopy, GitBranchPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { routes } from '@/utils/routes';
import { useApp } from '@/providers/app';
import { PromptContentEditor } from '@/components/editors/prompt-editor';
import { VariablesSidebar } from '@/components/variables-sidebar';
import { PromptTestModal } from '@/components/modals/test-prompt';
import { createDraftVersion } from '@/app/actions/prompts';
import { CreateVersionModal } from '@/components/modals/create-version';
import { CompileToClipboardModal } from '@/components/modals/compile-to-clipboard';
import { compareSemanticVersions } from '@/utils/versioning';
import { Button } from '@/components/ui/button';
import { H1 } from '@/components/typography';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  GetPromptByIdResult,
  GetAllPromptVersionsResult,
  GetLatestPromptVersionResult,
} from '@/lib/PromptsService';
import { cn } from '@/utils/shadcn';
import { STUDIO_FULL_HEIGHT } from '@/app/constants';
import { toast } from 'sonner';

type PromptDetailPageProps = {
  prompt: NonNullable<GetPromptByIdResult>;
  latestVersion: NonNullable<GetLatestPromptVersionResult>;
  allVersions: NonNullable<GetAllPromptVersionsResult>;
};

export const PromptDetailPage = (props: PromptDetailPageProps) => {
  const { prompt, latestVersion, allVersions } = props;

  const { selectedProjectUuid } = useApp();
  const router = useRouter();
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [isCompileModalOpen, setIsCompileModalOpen] = useState(false);

  const handleCreateNewVersion = () => {
    setIsCreatingVersion(true);
  };

  const handleVersionSubmit = async (customVersion: string) => {
    setIsCreatingVersion(false);

    try {
      const response = await createDraftVersion({
        promptId: prompt.id,
        latestVersion: latestVersion.version,
        customVersion,
      });

      if (response.success && response.data) {
        // Redirect to the edit page for the new draft version
        router.push(
          routes.studio.editPromptVersion(selectedProjectUuid, response.data.versionUuid),
        );
      } else {
        console.error('Error creating new version:', response.message);
        toast.error(response.message || 'Failed to create new version. Please try again.');
      }
    } catch (error) {
      console.error('Error creating new version:', error);
      toast.error('Failed to create new version. Please try again.');
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

  const sortedVersions = allVersions.sort((a, b) => {
    return compareSemanticVersions(b.version, a.version);
  });

  return (
    <div className={cn('flex', STUDIO_FULL_HEIGHT)}>
      <div className="flex-1 overflow-auto">
        <div className="p-6 h-full flex flex-col">
          <div className="mb-2">
            <Link
              href={routes.studio.prompts(selectedProjectUuid)}
              className="text-blue-500 hover:text-blue-600"
            >
              ← Back to Prompts
            </Link>
          </div>
          <H1 className="mb-6">{prompt.name}</H1>
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => setIsTestModalOpen(true)}
              className="bg-green-500 hover:bg-green-600 flex items-center gap-2"
            >
              <Play size={16} />
              Test
            </Button>
            <Button
              onClick={() => setIsCompileModalOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ClipboardCopy size={16} />
              Compile to Clipboard
            </Button>
            <Button onClick={handleCreateNewVersion} disabled={isCreatingVersion}>
              <GitBranchPlus size={16} />
              {isCreatingVersion ? 'Creating...' : 'New Version'}
            </Button>
          </div>
          <div className="flex-1">
            <Accordion
              type="multiple"
              defaultValue={[latestVersion.id.toString()]}
              className="w-full space-y-4"
            >
              {sortedVersions.map((version) => (
                <AccordionItem value={version.id.toString()} key={version.id} className="mb-0">
                  <AccordionTrigger className="no-underline hover:no-underline group/accordion-trigger cursor-pointer">
                    {/* className="w-full px-4 py-3 hover:bg-muted no-underline hover:no-underline focus:outline-none focus-visible:ring-0" */}
                    <div className="flex flex-1 items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium group-hover/accordion-trigger:underline">
                          Version {version.version}
                        </span>
                        {version.id === latestVersion.id && <Badge variant="PLANNED">Latest</Badge>}
                        {version.status === 'DRAFT' && (
                          <Badge variant="PROPOSED" className="ml-2">
                            DRAFT
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="link"
                          asChild
                          className="p-0 h-auto text-primary hover:text-primary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={routes.studio.editPromptVersion(
                              selectedProjectUuid,
                              version.uuid,
                            )}
                          >
                            Edit
                          </Link>
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          <time
                            dateTime={new Date(version.created_at).toISOString()}
                            suppressHydrationWarning
                          >
                            {new Date(version.created_at).toLocaleDateString()}
                          </time>
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <PromptContentEditor
                      content={version.content}
                      onContentChange={() => {}}
                      readOnly
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
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
        promptVersion={latestVersion}
      />

      <CreateVersionModal
        isOpen={isCreatingVersion}
        onClose={() => setIsCreatingVersion(false)}
        onSubmit={handleVersionSubmit}
        currentVersion={highestVersion}
      />

      <CompileToClipboardModal
        isOpen={isCompileModalOpen}
        onClose={() => setIsCompileModalOpen(false)}
        variables={latestVersion.prompt_variables}
        promptContent={latestVersion.content}
        globalContext={
          typeof prompt.projects.global_contexts?.content === 'object' &&
          prompt.projects.global_contexts?.content !== null &&
          !Array.isArray(prompt.projects.global_contexts?.content)
            ? prompt.projects.global_contexts.content
            : {}
        }
      />
    </div>
  );
};
