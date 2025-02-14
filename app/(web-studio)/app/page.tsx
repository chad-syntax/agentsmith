import { IconPrompt, IconRobot } from '@tabler/icons-react';
import Link from 'next/link';

export default function WebStudioPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-8">Web Studio</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl">
        <Link
          href="/app/prompts"
          className="aspect-square bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border p-4 flex flex-col"
        >
          <div className="flex items-center justify-center flex-1">
            <IconPrompt className="w-10 h-10 text-blue-500" />
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-medium text-center">Prompts</h3>
            <p className="text-xs text-gray-500 text-center mt-0.5">
              Manage your prompt library
            </p>
          </div>
        </Link>

        <Link
          href="/app/agents"
          className="aspect-square bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border p-4 flex flex-col"
        >
          <div className="flex items-center justify-center flex-1">
            <IconRobot className="w-10 h-10 text-purple-500" />
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-medium text-center">Agents</h3>
            <p className="text-xs text-gray-500 text-center mt-0.5">
              Manage your agents
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
