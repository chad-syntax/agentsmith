'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/auth';
import { signOutAction } from '@/app/actions/auth';
import { routes } from '@/utils/routes';
import { Button } from '@/components/ui/button';
import { H1, H2 } from '@/components/typography';

export const AccountPage = () => {
  const { user, agentsmithUser } = useAuth();

  if (!agentsmithUser) {
    return <div>No agentsmith user found, please sign out and sign in again.</div>;
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12 p-4">
      <H1>Account</H1>
      <div className="flex flex-row gap-2 items-start">
        <Button onClick={signOutAction} variant="outline">
          Sign Out
        </Button>
        <Button variant="destructive" asChild>
          <Link href={routes.studio.resetPassword}>Reset Password</Link>
        </Button>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <H2 className="mb-4">Your auth user details</H2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <H2 className="mb-4">Your agentsmith user details</H2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          {JSON.stringify(agentsmithUser, null, 2)}
        </pre>
      </div>
    </div>
  );
};
