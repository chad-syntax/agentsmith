'use client';

import Link from 'next/link';
import { Play, ClipboardCopy, GitBranchPlus, ArrowLeft, Pencil, Plus } from 'lucide-react';
import { routes } from '@/utils/routes';
import { useApp } from '@/providers/app';
import { PromptContentEditor } from '@/components/editors/prompt-editor';
import {
  VariablesSidebar,
  VariablesSidebarSkeleton,
} from '@/components/prompt-editor/variables-sidebar';
import { PromptTestModal } from '@/components/modals/test-prompt';
import { CreateVersionModal } from '@/components/modals/create-version';
import { CompileToClipboardModal } from '@/components/modals/compile-to-clipboard';
import { Button } from '@/components/ui/button';
import { H1 } from '@/components/typography';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/shadcn';
import { STUDIO_FULL_HEIGHT } from '@/app/constants';
import { usePromptPage } from '@/providers/prompt-page';

export const PromptDetailPage = () => {
  const prompt = usePromptPage((s) => s.prompt);
  const latestVersion = usePromptPage((s) => s.latestVersion);
  const allVersions = usePromptPage((s) => s.allVersions);
  const isCreatingVersion = usePromptPage((s) => s.isCreatingVersion);
  const openTestModal = usePromptPage((s) => s.openTestModal);
  const openCompileToClipboardModal = usePromptPage((s) => s.openCompileToClipboardModal);
  const openCreateVersionModal = usePromptPage((s) => s.openCreateVersionModal);

  const { selectedProjectUuid } = useApp();

  return (
    <div className={cn('flex', STUDIO_FULL_HEIGHT)}>
      <div className="flex-1 overflow-auto">
        <div className="p-6 h-full flex flex-col">
          <div className="mb-2">
            <Link
              href={routes.studio.prompts(selectedProjectUuid)}
              className="text-blue-500 hover:text-blue-600 flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Back to Prompts
            </Link>
          </div>
          <div className="mb-6 flex items-center gap-2">
            <H1>{prompt.name}</H1>
            <Link href={routes.studio.editPrompt(selectedProjectUuid, prompt.uuid)}>
              <Button variant="ghost" size="icon">
                <Pencil />
              </Button>
            </Link>
          </div>
          <div className="flex max-md:flex-wrap gap-2 mb-4">
            <Button
              onClick={openTestModal}
              className="bg-green-500 hover:bg-green-600 flex items-center gap-2"
            >
              <Play size={16} />
              Test
            </Button>
            <Button
              onClick={openCompileToClipboardModal}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ClipboardCopy size={16} />
              Compile to Clipboard
            </Button>
            <Button onClick={openCreateVersionModal} disabled={isCreatingVersion}>
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
              {allVersions.map((version) => (
                <AccordionItem value={version.id.toString()} key={version.id} className="mb-0">
                  <AccordionTrigger className="no-underline hover:no-underline group/accordion-trigger cursor-pointer">
                    <div className="flex flex-1 items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium group-hover/accordion-trigger:underline">
                          Version {version.version}
                        </span>
                        <Badge variant={version.status} className="ml-2">
                          {version.status}
                        </Badge>
                        {version.id === latestVersion.id && <Badge variant="PLANNED">Latest</Badge>}
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
                    {version.type === 'NON_CHAT' && (
                      <PromptContentEditor
                        content={version.content}
                        onContentChange={() => {}}
                        minHeight="250px"
                        readOnly
                      />
                    )}
                    {version.type === 'CHAT' && (
                      <>
                        <PromptContentEditor
                          key={version.pv_chat_prompts?.[0]?.id}
                          content={version.pv_chat_prompts?.[0]?.content ?? ''}
                          onContentChange={() => {}}
                          minHeight="250px"
                          readOnly
                        />
                        {version.pv_chat_prompts.length > 1 && (
                          <div className="flex gap-1 items-center text-xs p-2 mt-2 rounded border bg-muted/75 justify-center text-muted-foreground">
                            <Plus className="size-3" />
                            <span>{version.pv_chat_prompts.length - 1} more chat prompts</span>
                          </div>
                        )}
                      </>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>

      <VariablesSidebar readOnly />
      <PromptTestModal />
      <CreateVersionModal />
      <CompileToClipboardModal />
    </div>
  );
};

export const PromptDetailPageSkeleton = () => (
  <div className={cn('flex', STUDIO_FULL_HEIGHT)}>
    <div className="flex-1 overflow-auto">
      <div className="p-6 h-full flex flex-col">
        {/* Back button skeleton */}
        <div className="mb-2">
          <div className="bg-muted rounded w-24 h-4 animate-pulse">&nbsp;</div>
        </div>

        {/* Title skeleton */}
        <div className="mb-6">
          <div className="bg-muted rounded w-3/4 h-12 animate-pulse">&nbsp;</div>
        </div>

        {/* Action buttons skeleton */}
        <div className="flex gap-2 mb-4">
          <div className="bg-muted rounded w-16 h-9 animate-pulse">&nbsp;</div>
          <div className="bg-muted rounded w-32 h-9 animate-pulse">&nbsp;</div>
          <div className="bg-muted rounded w-24 h-9 animate-pulse">&nbsp;</div>
        </div>

        {/* Accordion skeleton */}
        <div className="flex-1">
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index}>
                <div className="pb-4">
                  <div className="flex flex-1 items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-muted rounded w-20 h-5 animate-pulse">&nbsp;</div>
                      {index === 0 && (
                        <div className="bg-muted rounded w-12 h-5 animate-pulse">&nbsp;</div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="bg-muted rounded w-8 h-4 animate-pulse">&nbsp;</div>
                      <div className="bg-muted rounded w-20 h-4 animate-pulse">&nbsp;</div>
                    </div>
                  </div>
                </div>
                <div className="pb-4">
                  <div className="bg-muted rounded w-full h-32 animate-pulse">&nbsp;</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    <VariablesSidebarSkeleton />
  </div>
);
