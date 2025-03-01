'use client';

import Link from 'next/link';
import { useAuth } from '@/app/providers/auth';
import { signOutAction } from '@/app/actions/auth';
import { useApp } from '@/app/providers/app';
import { routes } from '@/utils/routes';

export const AccountPage = () => {
  const { user, agentsmithUser } = useAuth();
  const { hasOpenRouterKey, isLoading } = useApp();

  if (!agentsmithUser) {
    return (
      <div>No agentsmith user found, please sign out and sign in again.</div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12 p-4">
      <h1 className="text-2xl font-bold">Account</h1>
      <div className="flex flex-row gap-2 items-start">
        <button
          onClick={signOutAction}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Sign Out
        </button>
        <Link
          href={routes.studio.resetPassword}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          Reset Password
        </Link>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-xl mb-4">Your auth user details</h2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-xl mb-4">Your agentsmith user details</h2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          {JSON.stringify(agentsmithUser, null, 2)}
        </pre>
      </div>
      <div>
        <h2 className="font-bold text-xl mb-4">Openrouter Account</h2>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <>
            <p className="pb-4">
              {hasOpenRouterKey
                ? '✅ You have an Openrouter key for this organization'
                : '❌ You do not have an Openrouter key for this organization'}
            </p>
            {hasOpenRouterKey && (
              <a
                href="https://openrouter.ai/settings/keys"
                className="text-blue-500 hover:text-blue-600 text-xs"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Your Openrouter Keys
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
};
