'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { __DUMMY_PROMPTS__, PromptVariable } from '@/app/constants';
import * as Collapsible from '@radix-ui/react-collapsible';
import { IconChevronRight, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';

export default function EditPromptPage() {
  const params = useParams();
  const promptId = params.id as string;
  const prompt = __DUMMY_PROMPTS__[promptId];
  const [isOpen, setIsOpen] = useState(true);
  const [variables, setVariables] = useState<PromptVariable[]>(
    prompt?.variables || []
  );

  console.log(prompt?.content);

  const editor = useEditor({
    parseOptions: {
      preserveWhitespace: 'full',
    },
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write your prompt here...',
      }),
    ],
    content: prompt?.content || '',
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
      },
    },
  });

  if (!prompt) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Prompt Not Found</h1>
        <p className="text-gray-600 mb-4">
          The prompt you're looking for doesn't exist.
        </p>
        <Link href="/app/prompts" className="text-blue-500 hover:text-blue-600">
          ← Back to Prompts
        </Link>
      </div>
    );
  }

  const addVariable = () => {
    setVariables([...variables, { name: '', type: 'string', required: true }]);
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
      [field]: value,
    };
    setVariables(newVariables);
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <Link
              href={`/app/prompts/${prompt.id}`}
              className="text-blue-500 hover:text-blue-600"
            >
              ← Back to Prompt
            </Link>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                defaultValue={prompt.name}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Version
              </label>
              <input
                type="text"
                defaultValue={prompt.version}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <div className="bg-white rounded-lg border">
                <EditorContent editor={editor} className="min-h-[500px] p-4" />
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
                      updateVariable(index, 'type', e.target.value as any)
                    }
                    className="w-full px-2 py-1 border rounded-md"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
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

      <div className="fixed bottom-0 right-0 p-6 bg-white border-t w-full flex justify-end space-x-4">
        <Link
          href={`/app/prompts/${prompt.id}`}
          className="px-4 py-2 border rounded-md hover:bg-gray-50"
        >
          Cancel
        </Link>
        <button
          type="button"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
