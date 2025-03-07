'use client';

import type { GetOrganizationDataResult } from '@/lib/organization';
import { useEffect, useState } from 'react';
import { IconClipboard, IconPencil } from '@tabler/icons-react';
import { useApp } from '@/app/providers/app';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@/utils/routes';
import { connectOpenrouter } from '@/app/actions/openrouter';
import { Button } from '@/components/ui/button';
import { H1, H2, P } from '@/components/typography';
import { ApiKeyReveal } from '@/components/ApiKeyReveal';

type OrganizationPageProps = {
  organization: GetOrganizationDataResult;
};

export const OrganizationPage = (props: OrganizationPageProps) => {
  const { organization } = props;

  const { hasOpenRouterKey, isOrganizationAdmin } = useApp();

  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(organization.invite_code);
    setIsCodeCopied(true);
    setTimeout(() => setIsCodeCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const inviteLink = `${window.origin}/join/${organization.invite_code}`;
    navigator.clipboard.writeText(inviteLink);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2000);
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-12 p-4">
      <div className="flex items-center gap-2">
        <H1>{organization.name}</H1>
        <Button variant="ghost" size="icon" asChild>
          <Link href={routes.studio.editOrganization(organization.uuid)}>
            <IconPencil className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <span>Invite Code: {organization.invite_code}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopyCode}
          className={isCodeCopied ? 'text-green-500' : 'text-blue-500'}
        >
          <IconClipboard className="h-4 w-4" />
        </Button>
      </div>
      <Button
        onClick={handleCopyLink}
        className={
          isLinkCopied
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : undefined
        }
      >
        {isLinkCopied ? 'Link Copied!' : 'Copy Invite Link'}
      </Button>

      <div className="flex flex-col gap-4">
        <H2>Projects</H2>
        <div className="flex flex-col gap-2">
          {organization.projects.map((project) => (
            <Button
              key={project.id}
              variant="link"
              asChild
              className="justify-start"
            >
              <Link href={routes.studio.project(project.uuid)}>
                {project.name}
              </Link>
            </Button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <H2>Organization Users</H2>
        <div className="flex flex-col gap-2">
          {organization.organization_users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 p-2 border rounded"
            >
              <div className="flex-1">
                <P className="text-sm text-muted-foreground">{user.role}</P>
                <P className="font-medium">{user.agentsmith_users.email}</P>
                <P className="text-sm text-muted-foreground">
                  {user.agentsmith_users.auth_user_id}
                </P>
              </div>
            </div>
          ))}
          {!organization.organization_users?.length && (
            <P className="text-muted-foreground italic">No users found</P>
          )}
        </div>
      </div>
      <div>
        <H2 className="mb-4">Openrouter Account</H2>
        <P className="pb-4">
          {hasOpenRouterKey
            ? '✅ This organization has an Openrouter key'
            : '❌ This organization does not have an Openrouter key'}
        </P>
        {!isOrganizationAdmin ? (
          <P>
            You must be an admin to connect to Openrouter. Please ask your
            organization admin to connect to Openrouter.
          </P>
        ) : hasOpenRouterKey ? (
          <Button variant="link" asChild className="text-xs p-0">
            <a
              href="https://openrouter.ai/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
            >
              View your keys in Openrouter
            </a>
          </Button>
        ) : (
          <Button onClick={() => connectOpenrouter(organization.uuid)}>
            Connect Openrouter
          </Button>
        )}
      </div>
      <div>
        <H2 className="mb-4">API Key</H2>
        <P className="pb-4">
          Use this API key to authenticate requests to the Agentsmith API from
          your applications.
        </P>
        <div className="mb-4">
          <ApiKeyReveal
            organizationUuid={organization.uuid}
            keyName="SDK_API_KEY"
          />
        </div>
        <P className="text-sm text-muted-foreground">
          This API key grants access to run prompts and other operations as your
          organization. Keep it secure and never expose it in client-side code.
        </P>
      </div>
    </div>
  );
};
