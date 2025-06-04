'use client';

import { CheckIcon, SquareIcon } from 'lucide-react';
import { H4 } from '@/components/typography';
import { cn } from '@/utils/shadcn';
import { GetOnboardingChecklistResult } from '@/lib/UsersService';
import Link from 'next/link';
import { routes } from '@/utils/routes';
import { useApp } from '@/providers/app';
import { ConnectProjectModal } from './modals/connect-project';
import { useState } from 'react';
import { Button } from './ui/button';
import { installGithubApp, syncProject } from '@/app/actions/github';
import { connectOpenrouter } from '@/app/actions/openrouter';
import { toast } from 'sonner';
import { revalidatePath } from 'next/cache';

type OnboardingChecklistOptions = {
  onboardingChecklistItem: NonNullable<GetOnboardingChecklistResult[number]>;
  defaultProjectUuid?: string;
};

export const OnboardingChecklist = (props: OnboardingChecklistOptions) => {
  const { defaultProjectUuid, onboardingChecklistItem } = props;
  const {
    organizationUuid,
    appInstalled,
    repoConnected,
    openrouterConnected,
    promptCreated,
    promptTested,
    repoSynced,
  } = onboardingChecklistItem;

  const [connectProjectModalOpen, setConnectProjectModalOpen] = useState(false);

  const { selectedProjectUuid } = useApp();

  const items = [
    {
      done: appInstalled,
      label: 'Install GitHub App',
      onClick: () => installGithubApp(organizationUuid),
    },
    {
      done: repoConnected,
      label: 'Connect a Repository',
      onClick: () => setConnectProjectModalOpen(true),
    },
    {
      done: openrouterConnected,
      label: 'Connect OpenRouter',
      onClick: () => connectOpenrouter(organizationUuid),
    },
    {
      done: promptCreated,
      label: 'Create a Prompt',
      href: routes.studio.prompts(selectedProjectUuid),
    },
    {
      done: promptTested,
      label: 'Test a Prompt',
      href: routes.studio.prompts(selectedProjectUuid),
    },
    {
      done: repoSynced,
      label: 'Sync your repository',
      disabled: !repoConnected,
      onClick: async () => {
        try {
          await syncProject(selectedProjectUuid);
        } catch (error: any) {
          toast.error('Failed to sync project', {
            description: error?.message,
          });
        }
      },
    },
  ];

  return (
    <>
      <ConnectProjectModal
        open={connectProjectModalOpen}
        onOpenChange={(open) => {
          setConnectProjectModalOpen(open);
        }}
        defaultProjectUuid={defaultProjectUuid}
      />
      <div>
        <H4 className="pb-4">Getting started checklist</H4>
        <ul className="flex flex-col gap-4">
          {items.map((item, idx) => (
            <li key={item.label} className="flex items-center gap-3">
              {item.done ? (
                <CheckIcon className="text-green-500 w-5 h-5" />
              ) : (
                <SquareIcon className="text-muted-foreground w-5 h-5" />
              )}
              {!item.done && item.href ? (
                <Link className="text-primary underline underline-offset-4" href={item.href}>
                  {item.label}
                </Link>
              ) : !item.done && item.onClick && !item.disabled ? (
                <Button
                  variant="link"
                  className="p-0 text-base h-auto font-normal underline"
                  onClick={item.onClick}
                >
                  {item.label}
                </Button>
              ) : (
                <p
                  className={cn(
                    'm-0 underline-offset-4',
                    item.done ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};
