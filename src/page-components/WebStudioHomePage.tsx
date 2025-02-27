import { IconPrompt, IconList, IconUser } from '@tabler/icons-react';
import Link from 'next/link';

export type WebStudioPageProps = {
  // Add any props that might be needed in the future
};

export const WebStudioHomePage = (props: WebStudioPageProps) => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-8">Web Studio</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl">
        <Link
          href="/studio/prompts"
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
          href="/studio/logs"
          className="aspect-square bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border p-4 flex flex-col"
        >
          <div className="flex items-center justify-center flex-1">
            <IconList className="w-10 h-10 text-orange-500" />
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-medium text-center">Logs</h3>
            <p className="text-xs text-gray-500 text-center mt-0.5">
              View prompt execution logs
            </p>
          </div>
        </Link>

        <Link
          href="/studio/account"
          className="aspect-square bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border p-4 flex flex-col"
        >
          <div className="flex items-center justify-center flex-1">
            <IconUser className="w-10 h-10 text-green-500" />
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-medium text-center">Account</h3>
            <p className="text-xs text-gray-500 text-center mt-0.5">
              Manage your account settings
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};
