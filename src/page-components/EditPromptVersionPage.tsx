'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { IconPlayerPlay } from '@tabler/icons-react';
import { Database } from '@/app/__generated__/supabase.types';
import { routes } from '@/utils/routes';
import { useApp } from '@/app/providers/app';
import { updatePromptVersion, createDraftVersion } from '@/app/actions/prompts';
import { PromptContentEditor, PromptVariable } from '@/components/editors/PromptContentEditor';
import { VariablesSidebar } from '@/components/prompt/VariablesSidebar';
import { PromptTestModal } from '@/components/prompt/PromptTestModal';
import { PublishUpdateConfirmModal } from '@/components/prompt/PublishUpdateConfirmModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { H1 } from '@/components/typography';
import type { CompletionConfig } from '@/lib/openrouter';
import { JsonEditor } from '@/components/editors/JsonEditor';
import { GetPromptVersionByUuidResult } from '@/lib/PromptsService';
import { syncProject } from '@/app/actions/github';
import { toast } from 'sonner';
import { SyncProjectButton } from '@/components/SyncProjectButton';

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
  const [initialVariables] = useState<PromptVariable[]>(initialPromptVersion.prompt_variables);

  const [variables, setVariables] = useState<PromptVariable[]>(
    currentPromptVersion.prompt_variables,
  );
  const [content, setContent] = useState(currentPromptVersion.content);
  const [config, setConfig] = useState(currentPromptVersion.config as CompletionConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [isSettingDraft, setIsSettingDraft] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const { selectedProjectUuid } = useApp();

  const hasChanges =
    content !== initialContent || JSON.stringify(variables) !== JSON.stringify(initialVariables);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleVariablesChange = (newVariables: PromptVariable[]) => {
    setVariables(newVariables);
  };

  const createSyncToast = () => {
    const toastId = toast('Prompt has been updated', {
      description: 'Would you like to sync your project?',
      duration: 6000,
      action: (
        <SyncProjectButton
          projectUuid={selectedProjectUuid}
          onSyncComplete={() => {
            toast.dismiss(toastId);
          }}
        />
      ),
    });
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

      createSyncToast();

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

      createSyncToast();

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
    <div className="flex h-[calc(100vh-64px)]">
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
            <div className="space-x-4">
              <Button
                onClick={handleTest}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
              >
                <IconPlayerPlay size={16} />
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
              <Label className="pb-2">Content</Label>
              <PromptContentEditor
                content={content}
                onContentChange={handleContentChange}
                onVariablesChange={handleVariablesChange}
                minHeight="500px"
              />
            </div>
          </div>
        </div>
      </div>

      <VariablesSidebar variables={variables} onVariablesChange={handleVariablesChange} />

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
    </div>
  );
};
