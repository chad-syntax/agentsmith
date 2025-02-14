'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { __DUMMY_AGENTS__, __DUMMY_PROMPTS__ } from '@/app/constants';

export default function AgentDetailPage() {
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

  const prompt = __DUMMY_PROMPTS__[agent.system_prompt_id];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/app/agents" className="text-blue-500 hover:text-blue-600">
          ← Back to Agents
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{agent.name}</h1>
        <Link
          href={`/app/agents/edit/${agent.id}`}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Edit Agent
        </Link>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Agent Details</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">ID:</span> {agent.id}
            </p>
            <p>
              <span className="font-medium">Slug:</span> {agent.slug}
            </p>
            <p>
              <span className="font-medium">Prompt:</span>{' '}
              <Link
                href={`/app/prompts/${prompt.id}`}
                className="text-blue-500 hover:text-blue-600"
              >
                {prompt.name}
              </Link>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Prompt Preview</h2>
          <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
            <code>{prompt.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
