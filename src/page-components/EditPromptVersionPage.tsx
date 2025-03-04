'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { IconPlayerPlay } from '@tabler/icons-react';
import { Database } from '@/app/__generated__/supabase.types';
import { GetPromptVersionByUuidResult } from '@/lib/prompts';
import { routes } from '@/utils/routes';
import { useApp } from '@/app/providers/app';
import { updatePromptVersion } from '@/app/actions/prompts';
import {
  PromptContentEditor,
  PromptVariable,
} from '@/components/editors/PromptContentEditor';
import { VariablesSidebar } from '@/components/prompt/VariablesSidebar';
import { PromptTestModal } from '@/components/prompt/PromptTestModal';

type EditPromptVersionPageProps = {
  promptVersion: NonNullable<GetPromptVersionByUuidResult>;
};

export const EditPromptVersionPage = (props: EditPromptVersionPageProps) => {
  const { promptVersion } = props;

  const router = useRouter();
  const [variables, setVariables] = useState<PromptVariable[]>(
    promptVersion.prompt_variables
  );
  const [content, setContent] = useState(promptVersion.content);
  const [model, setModel] = useState(
    (promptVersion.config as any)?.model || ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [fullResult, setFullResult] = useState<any | null>(null);
  const { selectedProjectUuid } = useApp();

  const handleSave = async (
    status: Database['public']['Enums']['prompt_status']
  ) => {
    if (!content.trim()) {
      alert('Please provide content for the prompt');
      return;
    }

    setIsSaving(true);

    try {
      await updatePromptVersion({
        promptVersionUuid: promptVersion.uuid,
        content,
        model,
        status,
        variables: variables.map((v) => ({
          id: v.id,
          name: v.name,
          type: v.type as Database['public']['Enums']['variable_type'],
          required: v.required,
        })),
      });

      // Redirect back to the prompt detail page
      router.push(
        routes.studio.promptDetail(
          selectedProjectUuid,
          promptVersion.prompts.uuid
        )
      );
    } catch (error) {
      console.error('Error updating prompt:', error);
      alert('Failed to update prompt. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestResult = (result: string, fullData: any) => {
    setTestResult(result);
    setFullResult(fullData);
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
              <button
                onClick={() => setIsTestModalOpen(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
              >
                <IconPlayerPlay size={16} />
                Test Prompt
              </button>
              <button
                onClick={() => handleSave('DRAFT')}
                disabled={isSaving}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                {isSaving ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={() => handleSave('PUBLISHED')}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {isSaving ? 'Saving...' : 'Publish'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Version
              </label>
              <input
                type="text"
                value={promptVersion.version}
                disabled
                className="w-full px-3 py-2 border rounded-md bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="openrouter/auto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <PromptContentEditor
                content={content}
                onContentChange={setContent}
                onVariablesChange={setVariables}
                minHeight="500px"
              />
            </div>
          </div>
        </div>
      </div>

      <VariablesSidebar
        variables={variables}
        onVariablesChange={setVariables}
      />

      <PromptTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        variables={variables}
        promptUuid={promptVersion.prompts.uuid}
        onTestResult={handleTestResult}
      />
    </div>
  );
};
