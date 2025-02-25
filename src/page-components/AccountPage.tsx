'use client';

import Link from 'next/link';
import { useQuery } from '@supabase-cache-helpers/postgrest-swr';
import { useAuth } from '@/app/providers/auth';
import { signOutAction } from '@/app/actions/auth';
import { connectOpenrouter } from '@/app/actions/openrouter';
import FetchDataSteps from '@/components/tutorial/fetch-data-steps';
import { createClient } from '&/supabase/client';
import { USER_KEYS } from '@/app/constants';

export const AccountPage = () => {
  const { user, agentsmithUser, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!agentsmithUser) {
    return (
      <div>No agentsmith user found, please sign out and sign in again.</div>
    );
  }

  const { data: userData, error } = useQuery(
    createClient()
      .from('agentsmith_users')
      .select('id, user_keys(id, key, vault_secret_id)')
      .eq('id', agentsmithUser.id)
      .single()
  );

  const hasOpenrouterKey = userData?.user_keys.some(
    (userKey) => userKey.key === USER_KEYS.OPENROUTER_API_KEY
  );

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      {error ? (
        <div className="flex flex-col gap-2 items-start">
          <div className="border border-error p-6 text-sm text-red-600">
            Error fetching user data: {error.message}
          </div>
        </div>
      ) : !hasOpenrouterKey ? (
        <div className="flex flex-col gap-2 items-start">
          <button
            onClick={connectOpenrouter}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Connect OpenRouter
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 items-start">
          <div className="border border-success p-6 text-sm text-green-600">
            Your OpenRouter account is connected
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2 items-start">
        <button
          onClick={signOutAction}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Sign Out
        </button>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <Link
          href="/app/account/reset-password"
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          Reset Password
        </Link>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Your auth user details</h2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">
          Your agentsmith user details
        </h2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          {JSON.stringify(agentsmithUser, null, 2)}
        </pre>
      </div>
      <div>
        <h2 className="font-bold text-2xl mb-4">Next steps</h2>
        <FetchDataSteps />
      </div>
    </div>
  );
};
