'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  __DUMMY_AGENTS__,
  __DUMMY_AGENT_VERSIONS__,
  __DUMMY_PROMPTS__,
} from '@//app/constants';

const getNextVersion = (currentVersion: string) => {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
};

export default function NewAgentVersionPage() {
  const params = useParams();
  const agentId = params.agentId as string;
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

  const currentVersion = __DUMMY_AGENT_VERSIONS__[agent.currentVersionId];

  if (!currentVersion) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Version Not Found</h1>
        <p className="text-gray-600 mb-4">
          The current version of this agent could not be found.
        </p>
        <Link href="/app/agents" className="text-blue-500 hover:text-blue-600">
          ← Back to Agents
        </Link>
      </div>
    );
  }

  const nextVersion = getNextVersion(currentVersion.version);

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

      <div className="flex items-baseline gap-4 mb-6">
        <h1 className="text-2xl font-bold">New Version: {agent.name}</h1>
        <span className="text-sm text-gray-500">
          Current: v{currentVersion.version} → New: v{nextVersion}
        </span>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            defaultValue={currentVersion.name}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slug
          </label>
          <input
            type="text"
            defaultValue={currentVersion.slug}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            System Prompt
          </label>
          <select
            defaultValue={currentVersion.systemPrompt.id}
            className="w-full px-3 py-2 border rounded-md"
          >
            {Object.values(__DUMMY_PROMPTS__).map((prompt) => (
              <option key={prompt.id} value={prompt.id}>
                {prompt.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Version
          </label>
          <input
            type="text"
            value={nextVersion}
            className="w-full px-3 py-2 border rounded-md bg-gray-50"
            disabled
          />
          <p className="mt-1 text-sm text-gray-500">
            Version will be incremented automatically from the current version.
          </p>
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
            Create New Version
          </button>
        </div>
      </div>
    </div>
  );
}
