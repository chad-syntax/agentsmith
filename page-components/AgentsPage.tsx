'use client';

import Link from 'next/link';
import {
  __DUMMY_AGENT_VERSIONS__,
  __DUMMY_AGENTS__,
  __DUMMY_PROMPTS__,
} from '@/app/constants';
import { generateTypes } from '@/app/actions/generate-types';

type AgentsPageProps = Record<string, never>;

const AgentsPage = (_props: AgentsPageProps) => {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Agents</h1>
        <div className="flex gap-4">
          <button
            onClick={async () => {
              const result = await generateTypes();
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
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create Agent
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        {Object.values(__DUMMY_AGENTS__).map((agent) => {
          const targetAgentVersion =
            __DUMMY_AGENT_VERSIONS__[agent.currentVersionId];
          const prompt = __DUMMY_PROMPTS__[targetAgentVersion.systemPrompt.id];
          return (
            <Link
              key={agent.id}
              href={`/app/agents/${agent.id}`}
              className="border p-4 rounded hover:border-blue-500"
            >
              <h2 className="text-xl font-semibold">{agent.name}</h2>
              <div className="mt-2 text-gray-600">
                <div>Actions: {targetAgentVersion.actions.length}</div>
                <div>Reactions: {targetAgentVersion.reactions.length}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export { AgentsPage };
