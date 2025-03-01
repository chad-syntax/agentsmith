'use client';

import type { Organization } from '@/lib/organization';
import { useEffect, useState } from 'react';
import { IconClipboard } from '@tabler/icons-react';
import { useApp } from '@/app/providers/app';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@/utils/routes';

type OrganizationPageProps = {
  organization: Organization;
};

export const OrganizationPage = (props: OrganizationPageProps) => {
  const { organization } = props;

  const { selectedOrganizationUuid, isLoading, hasOpenRouterKey } = useApp();

  const router = useRouter();

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

  useEffect(() => {
    if (
      selectedOrganizationUuid !== null &&
      selectedOrganizationUuid !== organization.uuid
    ) {
      router.push(routes.studio.organization(selectedOrganizationUuid!));
    }
  }, [selectedOrganizationUuid]);

  return (
    <div className="flex-1 w-full flex flex-col gap-12 p-4">
      <h1>{organization.name}</h1>
      <div className="flex items-center gap-2">
        <span>Invite Code: {organization.invite_code}</span>
        <IconClipboard
          onClick={handleCopyCode}
          className={`cursor-pointer ${isCodeCopied ? 'text-green-500' : 'text-blue-500'} hover:text-blue-700`}
          size={24}
        />
      </div>
      <button
        onClick={handleCopyLink}
        className={`mt-2 p-2 rounded ${isLinkCopied ? 'bg-green-500' : 'bg-blue-500'} text-white`}
      >
        {isLinkCopied ? 'Link Copied!' : 'Copy Invite Link'}
      </button>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Projects</h2>
        <div className="flex flex-col gap-2">
          {organization.projects.map((project) => (
            <Link
              href={routes.studio.project(project.uuid)}
              className="text-blue-500 hover:underline"
              key={project.id}
            >
              {project.name}
            </Link>
          ))}
        </div>
      </div>
      <div>
        <h2 className="font-bold text-xl mb-4">Openrouter Account</h2>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <>
            <p className="pb-4">
              {hasOpenRouterKey
                ? '✅ This organization has an Openrouter key'
                : '❌ This organization does not have an Openrouter key'}
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
