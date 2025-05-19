import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckIcon, CircleIcon, SquareIcon } from 'lucide-react';
import { H4, P } from '@/components/typography';
import { cn } from '@/utils/shadcn';
import { GetOnboardingChecklistResult } from '@/lib/UsersService';

type OnboardingChecklistOptions = {
  onboardingChecklistItem: NonNullable<GetOnboardingChecklistResult[number]>;
};

export const OnboardingChecklist = (props: OnboardingChecklistOptions) => {
  const {
    appInstalled,
    repoConnected,
    openrouterConnected,
    promptCreated,
    promptTested,
    repoSynced,
  } = props.onboardingChecklistItem;

  const items = [
    {
      done: appInstalled,
      label: 'Install GitHub App',
    },
    {
      done: repoConnected,
      label: 'Connect a repository',
    },
    {
      done: openrouterConnected,
      label: 'Connect OpenRouter',
    },
    {
      done: promptCreated,
      label: 'Create a prompt',
    },
    {
      done: promptTested,
      label: 'Test a prompt',
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
            <p className={cn(item.done ? 'text-foreground' : 'text-muted-foreground', 'm-0')}>
              {item.label}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};
