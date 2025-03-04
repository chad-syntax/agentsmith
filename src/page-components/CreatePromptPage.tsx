'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { IconPlayerPlay } from '@tabler/icons-react';
import { Database } from '@/app/__generated__/supabase.types';
import { routes } from '@/utils/routes';
import { useApp } from '@/app/providers/app';
import { createPrompt } from '@/app/actions/prompts';
import {
  PromptContentEditor,
  PromptVariable,
} from '@/components/editors/PromptContentEditor';
import { JsonEditor } from '@/components/editors/JsonEditor';
import { VariablesSidebar } from '@/components/prompt/VariablesSidebar';
import { PromptTestModal } from '@/components/prompt/PromptTestModal';

type CreatePromptPageProps = {
  projectId: number;
};

export const CreatePromptPage = (props: CreatePromptPageProps) => {
  const { projectId } = props;
  const router = useRouter();
  const [variables, setVariables] = useState<PromptVariable[]>([]);
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [config, setConfig] = useState({
    models: ['openrouter/auto'],
    temperature: 1.0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [promptUuid, setPromptUuid] = useState<string | null>(null);
  const { selectedProjectUuid } = useApp();

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please provide a name for the prompt');
      return;
    }

    if (!content.trim()) {
      alert('Please provide content for the prompt');
      return;
    }

    setIsSaving(true);

    try {
      const { promptUuid } = await createPrompt({
        name,
        projectId,
        content,
        config,
        variables,
      });

      setPromptUuid(promptUuid);

      // Redirect to the prompt detail page
      router.push(routes.studio.promptDetail(selectedProjectUuid, promptUuid));
    } catch (error) {
      console.error('Error creating prompt:', error);
      alert('Failed to create prompt. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6 flex justify-between items-center">
            <Link
              href={routes.studio.prompts(selectedProjectUuid)}
              className="text-blue-500 hover:text-blue-600"
            >
              ← Back to Prompts
            </Link>
            <div className="space-x-4">
              {content.trim() && (
                <button
                  onClick={() => setIsTestModalOpen(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
                >
                  <IconPlayerPlay size={16} />
                  Test Prompt
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {isSaving ? 'Creating...' : 'Create Prompt'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter prompt name"
              />
            </div>

            <JsonEditor
              value={config}
              onChange={setConfig}
              label="Config"
              minHeight="100px"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <PromptContentEditor
                content={content}
                onContentChange={setContent}
                onVariablesChange={setVariables}
                minHeight="300px"
              />
            </div>
          </div>
        </div>
      </div>

      <VariablesSidebar
        variables={variables}
        onVariablesChange={setVariables}
      />

      {/* Test Modal */}
      {promptUuid && (
        <PromptTestModal
          isOpen={isTestModalOpen}
          onClose={() => setIsTestModalOpen(false)}
          variables={variables}
          promptUuid={promptUuid}
        />
      )}
    </div>
  );
};
