'use client';

import Link from 'next/link';
import {
  Play,
  ClipboardCopy,
  Save,
  FileEdit,
  Send,
  GitBranchPlus,
  RefreshCw,
  Copy,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { routes } from '@/utils/routes';
import { useApp } from '@/providers/app';
import { PromptContentEditor } from '@/components/editors/prompt-editor';
import { VariablesSidebar, VariablesSidebarSkeleton } from '@/components/variables-sidebar';
import { PromptTestModal } from '@/components/modals/test-prompt';
import { PublishUpdateConfirmModal } from '@/components/modals/publish-update-confirm';
import { Button } from '@/components/ui/button';
import { CompileToClipboardModal } from '@/components/modals/compile-to-clipboard';
import { Label } from '@/components/ui/label';
import { H1 } from '@/components/typography';
import { JsonEditor } from '@/components/editors/json-editor';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
// import { EmojiModeButton } from '@/components/emoji-mode-button';
import { cn } from '@/utils/shadcn';
import { STUDIO_FULL_HEIGHT } from '@/app/constants';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { usePromptPage } from '@/providers/prompt-page';
import { ParsedVariable } from '@/utils/template-utils';

export const EditPromptVersionPage = () => {
  const {
    state,
    handleSave,
    openCreateVersionModal,
    openTestModal,
    openCompileToClipboardModal,
    openPublishConfirm,
    updateEditorContent,
    updateEditorConfig,
    updateEditorVariables,
    updateIncludes,
  } = usePromptPage();

  const {
    currentVersion,
    isSaving,
    isPublishing,
    isCreatingVersion,
    hasChanges,
    notExistingIncludes,
    missingGlobals,
    editorContent,
    editorConfig,
    editorVariables,
  } = state;

  const { selectedProjectUuid } = useApp();

  const isDraft = currentVersion.status === 'DRAFT';
  const isPublished = currentVersion.status === 'PUBLISHED';

  const onVariablesChange = (parsedVariables: ParsedVariable[]) => {
    const newVariables = parsedVariables.map((v) => {
      const existingVariable = editorVariables.find((ev) => ev.name === v.name);
      if (existingVariable) return existingVariable;

      return {
        name: v.name,
        type: v.type,
        required: true,
        default_value: null,
      };
    });
    updateEditorVariables(newVariables);
  };

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

        <div className="flex items-end justify-start mb-4 gap-2">
          <H1>{currentVersion.prompts.name}</H1>
          <Badge className="mb-1" variant={currentVersion.status}>
            {currentVersion.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between mb-4">
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
          <div className="flex gap-2 flex-wrap">
            {isDraft && (
              <>
                <Button
                  onClick={() => handleSave('DRAFT')}
                  disabled={isSaving || !hasChanges}
                  variant="secondary"
                >
                  <Save size={16} />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button onClick={() => handleSave('PUBLISHED')} disabled={isSaving || isPublishing}>
                  <Send size={16} />
                  {isSaving ? 'Publishing...' : 'Publish'}
                </Button>
              </>
            )}

            {isPublished && (
              <>
                <Button
                  onClick={() => openPublishConfirm()}
                  disabled={isSaving || !hasChanges}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  <RefreshCw size={16} />
                  {isSaving ? 'Updating...' : 'Update'}
                </Button>
                <Button onClick={openCreateVersionModal} disabled={isCreatingVersion || isSaving}>
                  <GitBranchPlus size={16} />
                  {isCreatingVersion ? 'Creating...' : 'New Version'}
                </Button>
                <Button
                  onClick={() => handleSave('DRAFT')}
                  disabled={isSaving || isPublishing}
                  variant="secondary"
                >
                  <FileEdit size={16} />
                  {isPublishing ? 'Setting to Draft...' : 'Set to Draft'}
                </Button>
              </>
            )}
            <Button
              onClick={openTestModal}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
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
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <Label className="pb-2 justify-between">
              <span>Config</span>
              <a
                className="text-xs flex items-center gap-1 underline text-primary"
                href="https://openrouter.ai/models"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Available Models on OpenRouter
                <ExternalLink size={12} />
              </a>
            </Label>
            <JsonEditor
              value={(editorConfig as object) || {}}
              onChange={(value) => {
                updateEditorConfig(value);
              }}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label>Content</Label>
              {/* <EmojiModeButton onEnabledChange={() => {}} onEmojiListLoaded={() => {}} /> */}
            </div>
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
            <PromptContentEditor
              content={editorContent}
              readOnly={false}
              onContentChange={updateEditorContent}
              onVariablesChange={onVariablesChange}
              onIncludesChange={updateIncludes}
              minHeight="500px"
            />
          </div>
        </div>
      </div>

      <VariablesSidebar />
      <PromptTestModal />
      <PublishUpdateConfirmModal />
      <CompileToClipboardModal />
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
