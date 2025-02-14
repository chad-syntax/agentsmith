'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { __DUMMY_AGENTS__, __DUMMY_PROMPTS__ } from '@/app/constants';

export default function EditAgentPage() {
  const params = useParams();
  const agentId = params.id as string;
  const agent = __DUMMY_AGENTS__[agentId];

  if (!agent) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Agent Not Found</h1>
        <p className="text-gray-600 mb-4">
          The agent you're looking for doesn't exist.
        </p>
        <Link href="/app/agents" className="text-blue-500 hover:text-blue-600">
          ← Back to Agents
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href={`/app/agents/${agent.id}`}
          className="text-blue-500 hover:text-blue-600"
        >
          ← Back to Agent
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Edit Agent: {agent.name}</h1>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            defaultValue={agent.name}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slug
          </label>
          <input
            type="text"
            defaultValue={agent.slug}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prompt
          </label>
          <select
            defaultValue={agent.system_prompt_id}
            className="w-full px-3 py-2 border rounded-md"
          >
            {Object.values(__DUMMY_PROMPTS__).map((prompt) => (
              <option key={prompt.id} value={prompt.id}>
                {prompt.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href={`/app/agents/${agent.id}`}
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
    </div>
  );
}
