'use client';

import Link from 'next/link';
import { __DUMMY_AGENTS__, __DUMMY_PROMPTS__ } from '@/app/constants';
import { generateTypes } from '@/app/actions/generate-types';

export default function AgentsPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Agents</h1>
        <div className="flex gap-4">
          <button
            onClick={async () => {
              const result = await generateTypes();

              // Create blob and download
              const blob = new Blob([result.content], {
                type: 'text/typescript',
              });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = result.filename;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Generate Types
          </button>
          <Link
            href="/app/agents/new"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Create Agent
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        {Object.values(__DUMMY_AGENTS__).map((agent) => {
          const prompt = __DUMMY_PROMPTS__[agent.system_prompt_id];
          return (
            <div
              key={agent.id}
              className="p-4 border rounded-lg hover:border-blue-500 transition-colors"
            >
              <Link href={`/app/agents/${agent.id}`} className="block">
                <h2 className="text-lg font-semibold mb-2">{agent.name}</h2>
                <div className="text-sm text-gray-500">
                  <p>Prompt: {prompt.name}</p>
                  <p>Slug: {agent.slug}</p>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
