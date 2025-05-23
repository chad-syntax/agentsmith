'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Play, ClipboardCopy } from 'lucide-react';
import { Database } from '@/app/__generated__/supabase.types';
import { routes } from '@/utils/routes';
import { useApp } from '@/providers/app';
import { updatePromptVersion, createDraftVersion } from '@/app/actions/prompts';
import { PromptContentEditor } from '@/components/editors/prompt-editor';
import { VariablesSidebar } from '@/components/variables-sidebar';
import { PromptTestModal } from '@/components/modals/test-prompt';
import { PublishUpdateConfirmModal } from '@/components/modals/publish-update-confirm';
import { Button } from '@/components/ui/button';
import { CompileToClipboardModal } from '@/components/modals/compile-to-clipboard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { H1 } from '@/components/typography';
import type { CompletionConfig } from '@/lib/openrouter';
import { JsonEditor } from '@/components/editors/json-editor';
import { GetPromptVersionByUuidResult } from '@/lib/PromptsService';
import { findMissingGlobalContext, ParsedVariable } from '@/utils/template-utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { EmojiModeButton } from '@/components/emoji-mode-button';
import { emojiTokenify } from '@/utils/emoji-tokenify';
import { cn } from '@/utils/shadcn';
import { STUDIO_FULL_HEIGHT } from '@/app/constants';

type EditPromptVersionPageProps = {
  promptVersion: NonNullable<GetPromptVersionByUuidResult>;
};

export const EditPromptVersionPage = (props: EditPromptVersionPageProps) => {
  const { promptVersion: initialPromptVersion } = props;
  const [currentPromptVersion, setCurrentPromptVersion] = useState(initialPromptVersion);

  const isDraft = currentPromptVersion.status === 'DRAFT';
  const isPublished = currentPromptVersion.status === 'PUBLISHED';

  const router = useRouter();
  const [initialContent] = useState(initialPromptVersion.content);
  const [initialVariables] = useState<ParsedVariable[]>(initialPromptVersion.prompt_variables);

  const [variables, setVariables] = useState<ParsedVariable[]>(
    currentPromptVersion.prompt_variables,
  );
  const [content, setContent] = useState(currentPromptVersion.content);
  const [config, setConfig] = useState(currentPromptVersion.config as CompletionConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [isSettingDraft, setIsSettingDraft] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [missingGlobals, setMissingGlobals] = useState<string[]>([]);
  const [isCompileModalOpen, setIsCompileModalOpen] = useState(false);
  const [isEmojiModeEnabled, setIsEmojiModeEnabled] = useState(false);
  const [tokenBpe, setTokenBpe] = useState<any>(null);
  const [emojiList, setEmojiList] = useState<string[]>([]);
  const { selectedProjectUuid, showSyncToast } = useApp();

  const globalContext = currentPromptVersion.prompts.projects.global_contexts?.content ?? {};

  const hasChanges =
    content !== initialContent || JSON.stringify(variables) !== JSON.stringify(initialVariables);

  const editorContent = useMemo(
    () =>
      isEmojiModeEnabled && tokenBpe && emojiList.length > 0
        ? emojiTokenify(content, tokenBpe, emojiList)
        : content,
    [isEmojiModeEnabled, tokenBpe, emojiList, content],
  );

  useEffect(() => {
    const loadTokenify = async () => {
      const { default: o200k_base } = await import('@/constants/o200k_base.json');
      setTokenBpe(o200k_base);
    };

    loadTokenify();
  }, [isEmojiModeEnabled]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleVariablesChange = (newVariables: ParsedVariable[]) => {
    const nonGlobalVariables = newVariables.filter((v) => v.name !== 'global');
    const globalVariable = newVariables.find((v) => v.name === 'global');

    if (globalVariable) {
      const missingGlobalContext = findMissingGlobalContext({ globalVariable, globalContext });

      setMissingGlobals(missingGlobalContext);
    }

    setVariables(nonGlobalVariables);
  };

  const handleSave = async (
    status: Database['public']['Enums']['prompt_status'],
    shouldRedirect = true,
  ) => {
    if (!content.trim()) {
      alert('Please provide content for the prompt');
      return false;
    }

    setIsSaving(true);

    try {
      await updatePromptVersion({
        promptVersionUuid: currentPromptVersion.uuid,
        content,
        config,
        status,
        variables: variables.map((v) => ({
          id: v.id,
          name: v.name,
          type: v.type as Database['public']['Enums']['variable_type'],
          required: v.required,
          default_value: v.default_value,
        })),
      });

      showSyncToast({
        title: 'Prompt has been updated',
      });

      if (shouldRedirect) {
        router.push(
          routes.studio.promptDetail(selectedProjectUuid, currentPromptVersion.prompts.uuid),
        );
      }

      setCurrentPromptVersion({
        ...currentPromptVersion,
        status,
      });

      return true;
    } catch (error) {
      console.error('Error updating prompt:', error);
      alert('Failed to update prompt. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetToDraft = async () => {
    setIsSettingDraft(true);
    try {
      await handleSave('DRAFT', false);
      setCurrentPromptVersion({
        ...currentPromptVersion,
        status: 'DRAFT',
      });
    } finally {
      setIsSettingDraft(false);
    }
  };

  const handleCreateNewVersion = async () => {
    setIsCreatingVersion(true);
    try {
      const { versionUuid } = await createDraftVersion({
        promptId: currentPromptVersion.prompts.id,
        latestVersion: currentPromptVersion.version,
        versionType: 'patch',
      });

      showSyncToast({
        title: 'Prompt has been updated',
      });

      router.push(routes.studio.editPromptVersion(selectedProjectUuid, versionUuid));
    } catch (error) {
      console.error('Error creating new version:', error);
      alert('Failed to create new version. Please try again.');
      setIsCreatingVersion(false);
    }
  };

  const handleTest = async () => {
    if (!hasChanges) {
      setIsTestModalOpen(true);
      return;
    }

    if (isDraft) {
      const saveSuccess = await handleSave('DRAFT', false);
      if (saveSuccess) {
        setIsTestModalOpen(true);
      }
    } else if (isPublished) {
      setIsPublishConfirmOpen(true);
    }
  };

  const handlePublishAndTest = async () => {
    const saveSuccess = await handleSave('PUBLISHED', false);
    setIsPublishConfirmOpen(false);
    if (saveSuccess) {
      setIsTestModalOpen(true);
    }
  };

  return (
    <div className={cn('flex', STUDIO_FULL_HEIGHT)}>
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6 flex justify-between items-center">
            <Link
              href={routes.studio.promptDetail(
                selectedProjectUuid,
                currentPromptVersion.prompts.uuid,
              )}
              className="text-blue-500 hover:text-blue-600"
            >
              ← Back to Prompt
            </Link>
          </div>
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => setIsCompileModalOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ClipboardCopy size={16} />
              Compile to Clipboard
            </Button>
            <Button
              onClick={handleTest}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
            >
              <Play size={16} />
              Test Prompt
            </Button>

            {isDraft && (
              <>
                <Button
                  onClick={() => handleSave('DRAFT', false)}
                  disabled={isSaving}
                  variant="secondary"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button onClick={() => handleSave('PUBLISHED')} disabled={isSaving}>
                  {isSaving ? 'Publishing...' : 'Publish'}
                </Button>
              </>
            )}

            {isPublished && (
              <>
                <Button
                  onClick={() => handleSave('PUBLISHED')}
                  disabled={isSaving}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  {isSaving ? 'Updating...' : 'Update Published Version'}
                </Button>
                <Button onClick={handleCreateNewVersion} disabled={isCreatingVersion || isSaving}>
                  {isCreatingVersion ? 'Creating...' : 'Create New Version'}
                </Button>
                <Button
                  onClick={handleSetToDraft}
                  disabled={isSaving || isSettingDraft}
                  variant="secondary"
                >
                  {isSettingDraft ? 'Setting to Draft...' : 'Set to Draft'}
                </Button>
              </>
            )}
          </div>

          <H1 className="mb-6">{currentPromptVersion.prompts.name}</H1>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="pb-2">Version</Label>
                <Input value={currentPromptVersion.version} disabled className="bg-muted" />
              </div>
              <div className="flex-1">
                <Label className="pb-2">Status</Label>
                <Input
                  value={currentPromptVersion.status}
                  disabled
                  className={`bg-muted ${
                    isPublished ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'
                  }`}
                />
              </div>
            </div>

            <div>
              <Label className="pb-2">Config</Label>
              <JsonEditor
                value={config}
                onChange={(value) => setConfig(value as CompletionConfig)}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label>Content</Label>
                <EmojiModeButton
                  onEnabledChange={setIsEmojiModeEnabled}
                  onEmojiListLoaded={setEmojiList}
                />
              </div>
              {missingGlobals.length > 0 && (
                <Alert className="mb-4" variant="destructive">
                  <AlertTitle>Missing Global Context</AlertTitle>
                  <AlertDescription>
                    The following global context variables are missing: {missingGlobals.join(', ')}
                  </AlertDescription>
                </Alert>
              )}
              <PromptContentEditor
                content={editorContent}
                readOnly={isEmojiModeEnabled}
                onContentChange={handleContentChange}
                onVariablesChange={handleVariablesChange}
                minHeight="500px"
                className={isEmojiModeEnabled ? 'text-2xl' : ''}
              />
            </div>
          </div>
        </div>
      </div>

      <VariablesSidebar
        globalContext={globalContext}
        variables={variables}
        onVariablesChange={handleVariablesChange}
      />

      <PromptTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        variables={variables}
        promptVersionUuid={currentPromptVersion.uuid}
      />

      <PublishUpdateConfirmModal
        isOpen={isPublishConfirmOpen}
        onClose={() => setIsPublishConfirmOpen(false)}
        onConfirm={handlePublishAndTest}
        isUpdating={isSaving}
      />

      <CompileToClipboardModal
        isOpen={isCompileModalOpen}
        onClose={() => setIsCompileModalOpen(false)}
        variables={variables}
        promptContent={content}
        globalContext={
          typeof currentPromptVersion.prompts.projects.global_contexts?.content === 'object' &&
          currentPromptVersion.prompts.projects.global_contexts?.content !== null &&
          !Array.isArray(currentPromptVersion.prompts.projects.global_contexts?.content)
            ? currentPromptVersion.prompts.projects.global_contexts.content
            : {}
        }
      />
    </div>
  );
};
