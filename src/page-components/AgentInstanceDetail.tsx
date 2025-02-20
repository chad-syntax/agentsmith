import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  __DUMMY_AGENT_INSTANCES__,
  __DUMMY_AGENTS__,
  __DUMMY_AGENT_VERSIONS__,
  __DUMMY_PROMPTS__,
} from '@/app/constants';
import { ExecutablePrompt } from '@/components/ExecutablePrompt';

type AgentInstanceDetailProps = {
  agentId: string;
  instanceId: string;
};

type ActionResponse = {
  success: boolean;
  actionId: string;
  timestamp: string;
  data: {
    choices: Array<{
      message: {
        content: string;
      };
    }>;
  };
};

// Add new type for reaction response (same structure as ActionResponse)
type ReactionResponse = ActionResponse;

export const AgentInstanceDetail = ({
  agentId,
  instanceId,
}: AgentInstanceDetailProps) => {
  const instance = __DUMMY_AGENT_INSTANCES__[instanceId];
  const [actionResponse, setActionResponse] = useState<ActionResponse | null>(
    null
  );
  // Add new state for reaction response
  const [reactionResponse, setReactionResponse] =
    useState<ReactionResponse | null>(null);

  if (!instance) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Link
            href={`/app/agents/${agentId}`}
            className="text-blue-500 hover:text-blue-600"
          >
            ← Back to Agent
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h2 className="text-red-800 font-medium mb-2">Error</h2>
          <p className="text-red-600">Instance not found</p>
        </div>
      </div>
    );
  }

  const agent = __DUMMY_AGENTS__[instance.agentId];
  const version = __DUMMY_AGENT_VERSIONS__[instance.agentVersionId];

  const handleExecuteAction = async (
    actionId: string,
    variables: Record<string, string>
  ) => {
    const response = await fetch(
      `/api/v1/agents/instances/${instanceId}/actions/${actionId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ variables }),
      }
    );
    const data = await response.json();
    setActionResponse(data);
    return data;
  };

  const handleExecuteReaction = async (
    reactionId: string,
    variables: Record<string, string>
  ) => {
    const response = await fetch(
      `/api/v1/agents/instances/${instanceId}/reactions/${reactionId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ variables }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to execute reaction');
    }

    const data = await response.json();
    setReactionResponse(data); // Add this line to set the reaction response
    return data;
  };

  const firstReaction = version.reactions[0];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href={`/app/agents/${agentId}`}
          className="text-blue-500 hover:text-blue-600"
        >
          ← Back to Agent
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{instance.name}</h1>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${
              instance.status === 'active'
                ? 'bg-green-100 text-green-800'
                : instance.status === 'idle'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
            }`}
          >
            {instance.status}
          </span>
          <span className="text-sm text-gray-500">
            Last updated: {new Date(instance.updatedAt).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-medium mb-4">Instance Details</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Agent</dt>
              <dd className="mt-1">{agent?.name || 'Unknown Agent'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Version</dt>
              <dd className="mt-1">v{version?.version || 'Unknown'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1">
                {new Date(instance.createdAt).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-medium mb-4">Context</h2>
          <pre className="text-sm bg-gray-50 p-4 rounded-md overflow-auto">
            {JSON.stringify(instance.ctx, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-medium mb-4">State</h2>
          <pre className="text-sm bg-gray-50 p-4 rounded-md overflow-auto">
            {JSON.stringify(instance.state, null, 2)}
          </pre>
        </div>
      </div>

      {/* Actions Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Actions</h2>
        <div className="grid gap-4">
          {version.actions.map((action) => {
            const prompt = __DUMMY_PROMPTS__[action.prompt.id];
            return (
              <ExecutablePrompt
                key={action.id}
                name={action.name}
                id={action.id}
                variables={prompt?.variables || []}
                onExecute={(variables) =>
                  handleExecuteAction(action.id, variables).then((data) => {
                    handleExecuteReaction(firstReaction.id, {
                      lead_details: data.data.choices[0].message.content,
                    });
                  })
                }
                isAction
              />
            );
          })}
        </div>
      </div>

      {/* Add this section after the Actions section */}
      {actionResponse && (
        <div className="mt-6 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Last Action Response</h3>
          <div className="space-y-2">
            <p>Status: {actionResponse.success ? 'Success' : 'Failed'}</p>
            <p>Action ID: {actionResponse.actionId}</p>
            <p>
              Timestamp: {new Date(actionResponse.timestamp).toLocaleString()}
            </p>
            <div>
              <p className="font-medium">AI Response:</p>
              <p className="whitespace-pre-wrap mt-2">
                {actionResponse.data.choices[0].message.content}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reactions Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Reactions</h2>
        <div className="grid gap-4">
          {version.reactions.map((reaction) => {
            const prompt = __DUMMY_PROMPTS__[reaction.prompt.id];
            return (
              <ExecutablePrompt
                key={reaction.id}
                name={reaction.name}
                id={reaction.id}
                variables={prompt?.variables || []}
                onExecute={(variables) =>
                  handleExecuteReaction(reaction.id, variables)
                }
                isAction={false}
              />
            );
          })}
        </div>
      </div>

      {/* Add Reaction Response section */}
      {reactionResponse && (
        <div className="mt-6 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Last Reaction Response</h3>
          <div className="space-y-2">
            <p>Status: {reactionResponse.success ? 'Success' : 'Failed'}</p>
            <p>Reaction ID: {reactionResponse.actionId}</p>
            <p>
              Timestamp: {new Date(reactionResponse.timestamp).toLocaleString()}
            </p>
            <div>
              <p className="font-medium">AI Response:</p>
              <p className="whitespace-pre-wrap mt-2">
                {reactionResponse.data.choices[0].message.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
