import {
  __DUMMY_AGENTS__,
  __DUMMY_AGENT_VERSIONS__,
  __DUMMY_PROMPTS__,
  __DUMMY_AGENT_INSTANCES__,
} from '@/app/constants';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type AgentDetailPageProps = {
  agentId: string;
};

export const AgentDetailPage = (props: AgentDetailPageProps) => {
  const { agentId } = props;

  const agent = __DUMMY_AGENTS__[agentId];

  if (!agent) {
    notFound();
  }

  const currentVersion = __DUMMY_AGENT_VERSIONS__[agent.currentVersionId];

  if (!currentVersion) {
    notFound();
  }

  const systemPrompt = __DUMMY_PROMPTS__[currentVersion.systemPrompt.id];

  // Get instances for this agent
  const agentInstances = Object.values(__DUMMY_AGENT_INSTANCES__).filter(
    (instance) => instance.agentId === agent.id
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <div className="text-sm text-gray-500">
            Version {currentVersion.version}
          </div>
        </div>
        <Link
          href={`/app/agents/${agent.id}/new-version`}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          New Version
        </Link>
      </div>

      <div className="mb-8 text-sm text-gray-600">
        <div className="mb-1">Slug: {currentVersion.slug}</div>
        <div className="mb-1">
          System Prompt:{' '}
          <Link
            href={`/app/prompts/${currentVersion.systemPrompt.id}`}
            className="text-blue-600 hover:underline"
          >
            {systemPrompt?.name || 'Unknown Prompt'}
          </Link>
        </div>
      </div>

      {/* Actions Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Actions</h2>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            // onClick={() => {}}
          >
            Add Action
          </button>
        </div>
        <div className="grid gap-4">
          {currentVersion.actions.map((action) => {
            const prompt = __DUMMY_PROMPTS__[action.prompt.id];
            return (
              <div key={action.id} className="border p-4 rounded">
                <h3 className="font-medium">{action.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Prompt:{' '}
                  <Link
                    href={`/app/prompts/${action.prompt.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {prompt?.name || 'Unknown Prompt'}
                  </Link>
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reactions Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Reactions</h2>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            // onClick={() => {}}
          >
            Add Reaction
          </button>
        </div>
        <div className="grid gap-4">
          {currentVersion.reactions.map((reaction) => {
            const prompt = __DUMMY_PROMPTS__[reaction.prompt.id];
            return (
              <div key={reaction.id} className="border p-4 rounded">
                <h3 className="font-medium">{reaction.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Prompt:{' '}
                  <Link
                    href={`/app/prompts/${reaction.prompt.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {prompt?.name || 'Unknown Prompt'}
                  </Link>
                </p>
                <div className="mt-2">
                  <h4 className="text-sm font-medium">Triggers:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {reaction.triggers.map((trigger, index) => (
                      <li key={index}>
                        {trigger.type}
                        {trigger.type === 'AFTER_ACTION_EXECUTION' && (
                          <span className="ml-1">
                            -{' '}
                            {currentVersion.actions.find(
                              (a) => a.id === trigger.action_id
                            )?.name || 'Unknown Action'}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Instances Section */}
      <div className="mb-8 pt-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Instances</h2>
          <Link
            href={`/app/agents/${agent.id}/instances/new`}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            New Instance
          </Link>
        </div>
        <div className="grid gap-4">
          {agentInstances.map((instance) => (
            <Link
              key={instance.id}
              href={`/app/agents/${agent.id}/instance/${instance.id}`}
              className="block border p-4 rounded hover:border-blue-500 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{instance.name}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    Version: {instance.agentVersionId}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    instance.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : instance.status === 'idle'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {instance.status}
                </span>
              </div>
              {Object.entries(instance.ctx).length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  <h4 className="font-medium mb-1">Configuration:</h4>
                  <ul className="list-disc list-inside">
                    {Object.entries(instance.ctx).map(([key, value]) => (
                      <li key={key}>
                        {key}: {value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
