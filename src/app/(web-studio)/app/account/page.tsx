'use client';

import Link from 'next/link';
import { useAuth } from '@/app/providers/auth';
import { signOutAction } from '@/app/actions/auth';
import FetchDataSteps from '@/components/tutorial/fetch-data-steps';
import { InfoIcon } from 'lucide-react';
import { redirect } from 'next/navigation';
import { connectOpenrouter } from '@/app/actions/openrouter';

export default function ProtectedPage() {
  const { user, isAuthenticated, agentsmithUser, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    console.log('User not found, redirecting to sign-in (account page)');
    return redirect('/sign-in');
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated
          user
        </div>
      </div>
      {!agentsmithUser?.openrouter_api_key ? (
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
        <h2 className="font-bold text-2xl mb-4">Your user details</h2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      <div>
        <h2 className="font-bold text-2xl mb-4">Next steps</h2>
        <FetchDataSteps />
      </div>
    </div>
  );
}
