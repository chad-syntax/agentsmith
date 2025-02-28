'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-django';
import 'prismjs/themes/prism.css';
import { useState } from 'react';
import { IconTrash } from '@tabler/icons-react';
import { Database } from '@/app/__generated__/supabase.types';
import { createClient } from '@/lib/supabase/client';

type PromptVariable = {
  name: string;
  type: Database['public']['Enums']['variable_type'];
  required: boolean;
};

type CreatePromptPageProps = {
  projectId: number;
};

export const CreatePromptPage = (props: CreatePromptPageProps) => {
  const { projectId } = props;
  const router = useRouter();
  const [variables, setVariables] = useState<PromptVariable[]>([]);
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState('openrouter/auto');
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
      const client = createClient();

      // Generate a slug from the name
      const slug = name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      // Create a new prompt
      const { data: promptData, error: promptError } = await client
        .from('prompts')
        .insert({
          name,
          project_id: projectId,
          slug,
        })
        .select('id, uuid')
        .single();

      if (promptError || !promptData) {
        throw new Error('Failed to create prompt: ' + promptError?.message);
      }

      const newPromptId = promptData.id;
      const newPromptUuid = promptData.uuid;

      // Create a new version
      const { data: versionData, error: versionError } = await client
        .from('prompt_versions')
        .insert({
          prompt_id: newPromptId,
          content,
          model,
          status: 'PUBLISHED',
          version: '1.0', // Default version string
        })
        .select('id')
        .single();

      if (versionError || !versionData) {
        // If we failed to create a version, delete the prompt to avoid orphans
        await client.from('prompts').delete().eq('id', newPromptId);
        throw new Error(
          'Failed to create prompt version: ' + versionError?.message
        );
      }

      const newVersionId = versionData.id;

      // Create variables for the new version if there are any
      if (variables.length > 0) {
        const variablesToInsert = variables.map((variable) => ({
          prompt_version_id: newVersionId,
          name: variable.name,
          type: variable.type,
          required: variable.required,
        }));

        const { error: variablesError } = await client
          .from('prompt_variables')
          .insert(variablesToInsert);

        if (variablesError) {
          throw new Error(
            'Failed to create prompt variables: ' + variablesError.message
          );
        }
      }

      // Redirect to the prompt detail page
      router.push(`/studio/prompts/${newPromptUuid}`);
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
              href="/studio/prompts"
              className="text-blue-500 hover:text-blue-600"
            >
              ← Back to Prompts
            </Link>
            <div className="space-x-4">
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
                    minHeight: '300px',
                  }}
                  className="border rounded-lg"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Variables
                </label>
                <button
                  type="button"
                  onClick={addVariable}
                  className="text-blue-500 hover:text-blue-600 text-sm"
                >
                  + Add Variable
                </button>
              </div>
              <div className="space-y-4">
                {variables.map((variable, index) => (
                  <div key={index} className="flex gap-4 items-center">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={variable.name}
                        onChange={(e) =>
                          updateVariable(index, 'name', e.target.value)
                        }
                        placeholder="Variable name"
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div className="w-32">
                      <select
                        value={variable.type}
                        onChange={(e) =>
                          updateVariable(index, 'type', e.target.value)
                        }
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="STRING">String</option>
                        <option value="NUMBER">Number</option>
                        <option value="BOOLEAN">Boolean</option>
                        <option value="JSON">JSON</option>
                      </select>
                    </div>
                    <div className="flex items-center px-2">
                      <input
                        type="checkbox"
                        checked={variable.required}
                        onChange={(e) =>
                          updateVariable(index, 'required', e.target.checked)
                        }
                        className="mr-2"
                      />
                      <label className="text-sm">Required</label>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariable(index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <IconTrash size={18} />
                    </button>
                  </div>
                ))}
                {variables.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No variables defined. Click "Add Variable" to add one.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
