'use client';

import { useParams } from 'next/navigation';
import { __DUMMY_PROMPTS__, PromptVariable } from '@/app/constants';
import Link from 'next/link';

export default function EditPromptPage() {
  const params = useParams();
  const promptId = params.id as string;
  const prompt = __DUMMY_PROMPTS__[promptId as keyof typeof __DUMMY_PROMPTS__];

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
    <div className="p-6">
      <div className="mb-6">
        <Link href="/app/prompts" className="text-blue-500 hover:text-blue-600">
          ← Back to Prompts
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Edit Prompt: {prompt.name}</h1>

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
            Content
          </label>
          <textarea
            defaultValue={prompt.content}
            rows={10}
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
            Variables
          </label>
          <div className="space-y-4">
            {prompt.variables.map((variable: PromptVariable, index: number) => (
              <div key={index} className="flex gap-4">
                <input
                  type="text"
                  defaultValue={variable.name}
                  placeholder="Variable name"
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <select
                  defaultValue={variable.type}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                </select>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={variable.required}
                    className="mr-2"
                  />
                  Required
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
