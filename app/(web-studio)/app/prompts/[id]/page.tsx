'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { __DUMMY_PROMPTS__ } from '@/app/constants';
import * as Collapsible from '@radix-ui/react-collapsible';
import { IconChevronRight } from '@tabler/icons-react';
import { useState } from 'react';
import { generateTypes } from '@/app/actions/generate-types';

export default function PromptDetailPage() {
  const params = useParams();
  const promptId = params.id as string;
  const prompt = __DUMMY_PROMPTS__[promptId];
  const [isOpen, setIsOpen] = useState(true);

  const editor = useEditor({
    immediatelyRender: false,
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

  const handleGenerateTypes = async () => {
    const response = await generateTypes();
    const blob = new Blob([response.content], { type: 'text/typescript' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = response.filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

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

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <Link
              href="/app/prompts"
              className="text-blue-500 hover:text-blue-600"
            >
              ← Back to Prompts
            </Link>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{prompt.name}</h1>
            <div className="space-x-4">
              <button
                onClick={handleGenerateTypes}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Generate Types
              </button>
              <Link
                href={`/app/prompts/edit/${prompt.id}`}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Edit Prompt
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg border">
            <EditorContent editor={editor} className="min-h-[500px] p-4" />
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
        <div className="p-4 border-b flex items-center">
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
        <Collapsible.Content className="p-4">
          <div className="space-y-4">
            {prompt.variables.map((variable, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border">
                <div className="font-medium mb-2">{variable.name}</div>
                <div className="text-sm text-gray-500">
                  <p>Type: {variable.type}</p>
                  <p>Required: {variable.required ? 'Yes' : 'No'}</p>
                </div>
              </div>
            ))}
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
}
