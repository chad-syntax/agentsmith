'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { IconPlayerPlay } from '@tabler/icons-react';
import { Database } from '@/app/__generated__/supabase.types';
import { GetPromptVersionByUuidResult } from '@/lib/prompts';
import { routes } from '@/utils/routes';
import { useApp } from '@/app/providers/app';
import { updatePromptVersion, createDraftVersion } from '@/app/actions/prompts';
import {
  PromptContentEditor,
  PromptVariable,
} from '@/components/editors/PromptContentEditor';
import { VariablesSidebar } from '@/components/prompt/VariablesSidebar';
import { PromptTestModal } from '@/components/prompt/PromptTestModal';
import { PublishUpdateConfirmModal } from '@/components/prompt/PublishUpdateConfirmModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { H1 } from '@/components/typography';
import type { PromptConfig } from '@/lib/openrouter';
import { JsonEditor } from '@/components/editors/JsonEditor';

type EditPromptVersionPageProps = {
  promptVersion: NonNullable<GetPromptVersionByUuidResult>;
};

export const EditPromptVersionPage = (props: EditPromptVersionPageProps) => {
  const { promptVersion } = props;
  const isDraft = promptVersion.status === 'DRAFT';
  const isPublished = promptVersion.status === 'PUBLISHED';

  const router = useRouter();
  // Store initial values to properly detect changes
  const [initialContent] = useState(promptVersion.content);
  const [initialVariables] = useState<PromptVariable[]>(
    promptVersion.prompt_variables
  );

  const [variables, setVariables] = useState<PromptVariable[]>(
    promptVersion.prompt_variables
  );
  const [content, setContent] = useState(promptVersion.content);
  const [config, setConfig] = useState(promptVersion.config as PromptConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const { selectedProjectUuid } = useApp();

  // Computed property to check if content has been modified
  const hasChanges =
    content !== initialContent ||
    JSON.stringify(variables) !== JSON.stringify(initialVariables);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleVariablesChange = (newVariables: PromptVariable[]) => {
    setVariables(newVariables);
  };

  const handleSave = async (
    status: Database['public']['Enums']['prompt_status'],
    shouldRedirect = true
  ) => {
    if (!content.trim()) {
      alert('Please provide content for the prompt');
      return false;
    }

    setIsSaving(true);

    try {
      await updatePromptVersion({
        promptVersionUuid: promptVersion.uuid,
        content,
        config,
        status,
        variables: variables.map((v) => ({
          id: v.id,
          name: v.name,
          type: v.type as Database['public']['Enums']['variable_type'],
          required: v.required,
        })),
      });

      // Redirect back to the prompt detail page if requested
      if (shouldRedirect) {
        router.push(
          routes.studio.promptDetail(
            selectedProjectUuid,
            promptVersion.prompts.uuid
          )
        );
      }

      return true;
    } catch (error) {
      console.error('Error updating prompt:', error);
      alert('Failed to update prompt. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewVersion = async () => {
    setIsCreatingVersion(true);
    try {
      const { versionUuid } = await createDraftVersion({
        promptId: promptVersion.prompts.id,
        latestVersion: promptVersion.version,
        versionType: 'patch', // Default to patch version increment
      });

      // Redirect to the edit page for the new draft version
      router.push(
        routes.studio.editPromptVersion(selectedProjectUuid, versionUuid)
      );
    } catch (error) {
      console.error('Error creating new version:', error);
      alert('Failed to create new version. Please try again.');
      setIsCreatingVersion(false);
    }
  };

  const handleTest = async () => {
    if (!hasChanges) {
      // If no changes, just open the test modal
      setIsTestModalOpen(true);
      return;
    }

    if (isDraft) {
      // For drafts, auto-save before testing
      const saveSuccess = await handleSave('DRAFT', false);
      if (saveSuccess) {
        setIsTestModalOpen(true);
      }
    } else if (isPublished) {
      // For published versions, show confirmation modal
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
                promptVersion.prompts.uuid
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
                  <Button
                    onClick={() => handleSave('PUBLISHED')}
                    disabled={isSaving}
                  >
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
                  <Button
                    onClick={handleCreateNewVersion}
                    disabled={isCreatingVersion || isSaving}
                  >
                    {isCreatingVersion ? 'Creating...' : 'Create New Version'}
                  </Button>
                </>
              )}
            </div>
          </div>

          <H1 className="mb-6">{promptVersion.prompts.name}</H1>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label>Version</Label>
                <Input
                  value={promptVersion.version}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="flex-1">
                <Label>Status</Label>
                <Input
                  value={promptVersion.status}
                  disabled
                  className={`bg-gray-50 ${
                    isPublished
                      ? 'text-green-600 font-medium'
                      : 'text-amber-600 font-medium'
                  }`}
                />
              </div>
            </div>

            <div>
              <Label>Config</Label>
              {/* <Input
                type="text"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                }}
                className="bg-gray-50"
                placeholder="openrouter/auto"
              /> */}
              <JsonEditor
                value={config}
                onChange={(value) => setConfig(value as PromptConfig)}
              />
            </div>

            <div>
              <Label>Content</Label>
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

      <VariablesSidebar
        variables={variables}
        onVariablesChange={handleVariablesChange}
      />

      <PromptTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        variables={variables}
        promptVersionUuid={promptVersion.uuid}
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
