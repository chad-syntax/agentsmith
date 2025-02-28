'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-django';
import 'prismjs/themes/prism.css';
import * as Collapsible from '@radix-ui/react-collapsible';
import { IconChevronRight, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Database } from '@/app/__generated__/supabase.types';
import {
  //   createPromptVersion,
  //   updatePromptName,
  getPromptById,
  //   getLatestPromptVersion,
} from '@/lib/prompts';

type PromptVariable = Omit<
  Database['public']['Tables']['prompt_variables']['Row'],
  'id' | 'created_at' | 'updated_at' | 'prompt_version_id'
> & {
  id?: number;
};

type PromptEditPageProps = {
  prompt: NonNullable<Awaited<ReturnType<typeof getPromptById>>>;
  initialContent: string;
  initialModel: string;
  initialVariables: PromptVariable[];
};

export const PromptEditPage = (props: PromptEditPageProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [variables, setVariables] = useState<PromptVariable[]>(
    props.initialVariables
  );
  const [content, setContent] = useState(props.initialContent);
  const [name, setName] = useState(props.prompt.name);
  const [model, setModel] = useState(props.initialModel);
  const [testVariables, setTestVariables] = useState<Record<string, string>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const addVariable = () => {
    setVariables([...variables, { name: '', type: 'STRING', required: true }]);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const updateVariable = (
    index: number,
    field: keyof PromptVariable,
    value: string | boolean
  ) => {
    const newVariables = [...variables];
    newVariables[index] = {
      ...newVariables[index],
      [field]:
        field === 'type' && typeof value === 'string'
          ? (value.toUpperCase() as Database['public']['Enums']['variable_type'])
          : value,
    };
    setVariables(newVariables);
  };

  const handleTestPrompt = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/prompts/${props.prompt.uuid}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variables: testVariables,
        }),
      });

      const data = await response.json();
      setTestResult(data.completion.choices[0].message.content);
    } catch (error) {
      console.error('Error testing prompt:', error);
      setTestResult('Error: Failed to test prompt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Update prompt name if changed
      if (name !== props.prompt.name) {
        // const nameUpdated = await updatePromptName({
        //   promptUuid: props.prompt.uuid,
        //   name,
        // });
        // if (!nameUpdated) {
        //   throw new Error('Failed to update prompt name');
        // }
      }

      // Create a new version
      // const newVersionId = await createPromptVersion({
      //   promptId: props.prompt.id,
      //   content,
      //   model,
      //   variables: variables.map((v) => ({
      //     name: v.name,
      //     type: v.type as Database['public']['Enums']['variable_type'],
      //     required: v.required,
      //   })),
      // });

      // if (!newVersionId) {
      //   throw new Error('Failed to create new version');
      // }

      // Redirect back to the prompt detail page
      router.push(`/app/prompts/${props.prompt.uuid}`);
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('Failed to save prompt. Please try again.');
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
              href={`/studio/prompts/${props.prompt.uuid}`}
              className="text-blue-500 hover:text-blue-600"
            >
              ← Back to Prompt
            </Link>
            <div className="space-x-4">
              <button
                onClick={() => setIsTestModalOpen(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Test Prompt
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {isSaving ? 'Saving...' : 'Save New Version'}
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
              <div className="bg-white rounded-lg border">
                <Editor
                  value={content}
                  onValueChange={(code) => setContent(code)}
                  highlight={(code) =>
                    highlight(code, languages.django, 'django')
                  }
                  padding={16}
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 14,
                    minHeight: '500px',
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Collapsible.Root
        open={isOpen}
        onOpenChange={setIsOpen}
        className={`border-l bg-gray-50 transition-all duration-300 ${
          isOpen ? 'w-80' : 'w-12'
        }`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center">
            <Collapsible.Trigger asChild>
              <button className="p-2 hover:bg-gray-100 rounded-md">
                <IconChevronRight
                  className={`w-5 h-5 transition-transform ${
                    isOpen ? 'transform rotate-90' : ''
                  }`}
                />
              </button>
            </Collapsible.Trigger>
            {isOpen && <span className="font-medium ml-2">Variables</span>}
          </div>
          {isOpen && (
            <button
              onClick={addVariable}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Add Variable
            </button>
          )}
        </div>
        <Collapsible.Content className="p-4">
          <div className="space-y-4">
            {variables.map((variable, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-start mb-4">
                  <input
                    type="text"
                    value={variable.name}
                    onChange={(e) =>
                      updateVariable(index, 'name', e.target.value)
                    }
                    placeholder="Variable name"
                    className="flex-1 px-2 py-1 border rounded-md mr-2"
                  />
                  <button
                    onClick={() => removeVariable(index)}
                    className="p-1 text-gray-500 hover:text-red-500"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  <select
                    value={variable.type}
                    onChange={(e) =>
                      updateVariable(index, 'type', e.target.value)
                    }
                    className="w-full px-2 py-1 border rounded-md"
                  >
                    <option value="STRING">String</option>
                    <option value="NUMBER">Number</option>
                    <option value="BOOLEAN">Boolean</option>
                  </select>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={variable.required}
                      onChange={(e) =>
                        updateVariable(index, 'required', e.target.checked)
                      }
                      className="mr-2"
                    />
                    Required
                  </label>
                </div>
              </div>
            ))}
          </div>
        </Collapsible.Content>
      </Collapsible.Root>

      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title="Test Prompt"
      >
        <div className="space-y-4">
          {variables.map((variable) => (
            <div key={variable.name || Math.random()}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {variable.name}
                {variable.required && <span className="text-red-500">*</span>}
              </label>
              <input
                type={variable.type === 'NUMBER' ? 'number' : 'text'}
                value={testVariables[variable.name] || ''}
                onChange={(e) => {
                  setTestVariables({
                    ...testVariables,
                    [variable.name]: e.target.value,
                  });
                }}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          ))}

          <div className="mt-6">
            <button
              onClick={handleTestPrompt}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              {isLoading ? 'Running...' : 'Run Test'}
            </button>
          </div>

          {testResult && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Result:</h3>
              <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                {testResult}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
