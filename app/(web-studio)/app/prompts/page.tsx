'use client';

import Link from 'next/link';
import { __DUMMY_PROMPTS__ } from '@/app/constants';

export default function PromptsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Prompts Library</h1>
      <div className="grid gap-4">
        {Object.values(__DUMMY_PROMPTS__).map((prompt) => (
          <div
            key={prompt.id}
            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-semibold">{prompt.name}</h2>
              <Link
                href={`/app/prompts/edit/${prompt.id}`}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Edit
              </Link>
            </div>
            <p className="text-gray-600 mb-3 whitespace-pre-wrap">
              {prompt.content}
            </p>
            <div className="mt-4">
              <h3 className="font-medium mb-2">Required Variables:</h3>
              <div className="flex flex-wrap gap-2">
                {prompt.variables.map((variable) => (
                  <span
                    key={variable.name}
                    className="px-2 py-1 bg-gray-100 rounded text-sm"
                  >
                    {variable.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Version: {prompt.version}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
