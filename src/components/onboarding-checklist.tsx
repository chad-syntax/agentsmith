'use client';

import { CheckIcon, SquareIcon } from 'lucide-react';
import { H4 } from '@/components/typography';
import { cn } from '@/utils/shadcn';
import { GetOnboardingChecklistResult } from '@/lib/UsersService';
import Link from 'next/link';
import { routes } from '@/utils/routes';
import { useApp } from '@/providers/app';

type OnboardingChecklistOptions = {
  onboardingChecklistItem: NonNullable<GetOnboardingChecklistResult[number]>;
};

export const OnboardingChecklist = (props: OnboardingChecklistOptions) => {
  const {
    organizationUuid,
    appInstalled,
    repoConnected,
    openrouterConnected,
    promptCreated,
    promptTested,
    repoSynced,
  } = props.onboardingChecklistItem;

  const { selectedProjectUuid } = useApp();

  const items = [
    {
      done: appInstalled,
      label: 'Install GitHub App',
      href: routes.studio.settings(organizationUuid),
    },
    {
      done: repoConnected,
      label: 'Connect a Repository',
      href: routes.studio.settings(organizationUuid),
    },
    {
      done: openrouterConnected,
      label: 'Connect OpenRouter',
      href: routes.studio.settings(organizationUuid),
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
    },
  ];

  return (
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
              <Link className="text-primary underline" href={item.href}>
                {item.label}
              </Link>
            ) : (
              <p className={cn(item.done ? 'text-foreground' : 'text-muted-foreground', 'm-0')}>
                {item.label}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
