'use client';

import { useApp } from '@/providers/app';
import { useAuth } from '@/providers/auth';
import { H1, H3 } from '@/components/typography';
import { SignOutButton } from '@/components/sign-out-button';
import { Button } from '@/components/ui/button';
import { Github, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { routes } from '@/utils/routes';

export const AccountPage = () => {
  const { user } = useAuth();
  const { userOrganizationData } = useApp();

  if (!user) {
    return <div>No user found, please sign out and sign in again.</div>;
  }

  const githubUsername = user.user_metadata?.preferred_username || user.user_metadata?.user_name;
  const githubProfileUrl = githubUsername ? `https://github.com/${githubUsername}` : null;

  return (
    <div className="flex-1 w-full flex flex-col gap-8 p-4">
      <div className="flex flex-row gap-8 items-center justify-start">
        <H1>Account</H1>
        <SignOutButton />
      </div>
      <div className="flex flex-col gap-2 items-start">
        <H3>Details</H3>
        <Badge variant="outline" className="text-md [&>svg]:size-5">
          <Mail />
          {user.email}
        </Badge>
        {githubProfileUrl && (
          <a
            href={githubProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-row items-center gap-2 hover:underline"
          >
            <Badge variant="outline" className="text-md [&>svg]:size-5">
              <Github />
              <span>@{githubUsername}</span>
            </Badge>
          </a>
        )}
      </div>
      <div className="flex flex-col gap-4 items-start">
        <H3>Organization Memberships</H3>
        <div className="flex flex-col gap-2 items-start">
          {userOrganizationData?.organization_users.map((orgUser) => (
            <div key={orgUser.organizations.uuid}>
              <Badge variant="outline">{orgUser.role}</Badge>
              <span className="mx-2">•</span>
              <Link
                href={routes.studio.organization(orgUser.organizations.uuid)}
                className="hover:underline"
              >
                {orgUser.organizations.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AccountPageSkeleton = () => (
  <div className="flex-1 w-full flex flex-col gap-8 p-4">
    <div className="flex flex-row gap-8 items-center justify-start">
      <H1>Account</H1>
      <Button variant="destructive" disabled>
        Sign Out
      </Button>
    </div>
    <div className="flex flex-col gap-2 items-start">
      <H3>Details</H3>
      <div className="bg-muted rounded w-48 h-6 animate-pulse">&nbsp;</div>
      <div className="bg-muted rounded w-32 h-6 animate-pulse">&nbsp;</div>
    </div>
    <div className="flex flex-col gap-4 items-start">
      <H3>Organization Memberships</H3>
      <div className="flex flex-col gap-2 items-start">
        <div className="flex items-center gap-2">
          <div className="bg-muted rounded w-16 h-6 animate-pulse">&nbsp;</div>
          <div className="bg-muted rounded w-2 h-2 animate-pulse">&nbsp;</div>
          <div className="bg-muted rounded w-32 h-6 animate-pulse">&nbsp;</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-muted rounded w-20 h-6 animate-pulse">&nbsp;</div>
          <div className="bg-muted rounded w-2 h-2 animate-pulse">&nbsp;</div>
          <div className="bg-muted rounded w-28 h-6 animate-pulse">&nbsp;</div>
        </div>
      </div>
    </div>
  </div>
);
