'use client';

import Link from 'next/link';
import { Copy, ArrowLeft } from 'lucide-react';
import { routes } from '@/utils/routes';
import { useApp } from '@/providers/app';
import {
  VariablesSidebar,
  VariablesSidebarSkeleton,
} from '@/components/prompt-editor/variables-sidebar';
import { PromptTestModal } from '@/components/modals/test-prompt';
import { PublishUpdateConfirmModal } from '@/components/modals/publish-update-confirm';
import { Button } from '@/components/ui/button';
import { CompileToClipboardModal } from '@/components/modals/compile-to-clipboard';
import { H1 } from '@/components/typography';
import { cn } from '@/utils/shadcn';
import { STUDIO_FULL_HEIGHT } from '@/app/constants';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { usePromptPage } from '@/providers/prompt-page';
import { NonChatPromptEditor } from '@/components/prompt-editor/non-chat-prompt-editor';
import { ChatPromptsEditor } from '@/components/prompt-editor/chat-prompts-editor';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EditorActions } from '@/components/prompt-editor/editor-actions';
import { CreateVersionModal } from '@/components/modals/create-version';

export const EditPromptVersionPage = () => {
  const currentVersion = usePromptPage((s) => s.currentVersion);
  const missingGlobals = usePromptPage((s) => s.missingGlobals);
  const notExistingIncludes = usePromptPage((s) => s.notExistingIncludes);
  const invalidIncludes = usePromptPage((s) => s.invalidIncludes);

  const { selectedProjectUuid } = useApp();

  return (
    <div className={cn('flex', STUDIO_FULL_HEIGHT)}>
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <Link
            href={routes.studio.promptDetail(selectedProjectUuid, currentVersion.prompts.uuid)}
            className="text-blue-500 hover:text-blue-600 flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back to Prompt
          </Link>
        </div>

        <div className="flex max-md:flex-wrap max-md:gap-4 items-end justify-start mb-4 gap-2">
          <H1>{currentVersion.prompts.name}</H1>
          <Badge className="mb-1" variant={currentVersion.status}>
            {currentVersion.status}
          </Badge>
        </div>
        <div className="flex max-md:flex-wrap max-md:gap-4 items-center justify-between mb-4">
          <div className="flex items-center justify-start gap-0.5">
            <span className="py-1 px-2 bg-muted rounded-sm text-sm">
              {currentVersion.prompts.slug}@{currentVersion.version}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${currentVersion.prompts.slug}@${currentVersion.version}`,
                );
                toast.success('Copied to clipboard');
              }}
            >
              <Copy />
            </Button>
          </div>
          <EditorActions />
        </div>

        <div className="space-y-6">
          {missingGlobals.length > 0 && (
            <Alert className="mb-4" variant="destructive">
              <AlertTitle>Missing Global Context</AlertTitle>
              <AlertDescription>
                The following global context variables are missing: {missingGlobals.join(', ')}
              </AlertDescription>
            </Alert>
          )}
          {notExistingIncludes.size > 0 && (
            <Alert className="mb-4" variant="destructive">
              <AlertTitle>Missing Includes</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside ml-1">
                  {Array.from(notExistingIncludes).map((n) => (
                    <li key={n}>Prompt "{n}" not found</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          {invalidIncludes.size > 0 && (
            <Alert className="mb-4" variant="destructive">
              <AlertTitle>Invalid Includes</AlertTitle>
              <AlertDescription>
                Can only include non-chat prompts, invalid prompts:{' '}
                {Array.from(invalidIncludes)
                  .map((i) => i.arg)
                  .join(', ')}
              </AlertDescription>
            </Alert>
          )}
          {currentVersion.type === 'NON_CHAT' ? (
            <NonChatPromptEditor />
          ) : currentVersion.type === 'CHAT' ? (
            <ChatPromptsEditor />
          ) : (
            <div>Unknown prompt type, please contact support</div>
          )}
        </div>
      </div>

      <VariablesSidebar />
      <PromptTestModal />
      <PublishUpdateConfirmModal />
      <CompileToClipboardModal />
      <CreateVersionModal />
    </div>
  );
};

export const EditPromptVersionPageSkeleton = () => (
  <div className={cn('flex', STUDIO_FULL_HEIGHT)}>
    <div className="flex-1 overflow-auto p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-12 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="flex gap-2 mb-4">
          <div className="h-10 bg-gray-200 rounded w-24"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="space-y-6">
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
    <VariablesSidebarSkeleton />
  </div>
);
