'use client';

import { CheckIcon, ChevronDown, PartyPopper, SquareIcon } from 'lucide-react';
import { H4 } from '@/components/typography';
import { cn } from '@/utils/shadcn';
import Link from 'next/link';
import { routes } from '@/utils/routes';
import { useApp } from '@/providers/app';
import { ConnectProjectModal } from '@/components/modals/connect-project';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { installGithubApp, syncProject } from '@/app/actions/github';
import { connectOpenrouter } from '@/app/actions/openrouter';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GetOnboardingChecklistResult } from '@/lib/UsersService';
import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';

type OnboardingChecklistProps = {
  floating?: boolean;
};

export const OnboardingChecklist = (props: OnboardingChecklistProps = { floating: false }) => {
  const { floating } = props;

  const [connectProjectModalOpen, setConnectProjectModalOpen] = useState(false);
  const [listExpanded, setListExpanded] = useState(floating ? false : true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const prevAllItemsCompletedRef = useRef(false);
  const onboardingChecklistRef = useRef<GetOnboardingChecklistResult[number] | null>(null);
  const pathname = usePathname();

  const {
    selectedProjectUuid,
    selectedOrganizationUuid,
    onboardingChecklist,
    setOnboardingChecklist,
  } = useApp();

  const handleConnectOpenrouter = async () => {
    const response = await connectOpenrouter(selectedOrganizationUuid);

    if (response && !response.success) {
      toast.error('Failed to connect OpenRouter, please try again or contact support.');
      return;
    }
  };

  const trackOnboardingItemClick = (item: any) => {
    posthog.capture('onboarding_item_click', {
      item: item.label,
    });
  };

  const items = !onboardingChecklist
    ? []
    : [
        {
          done: onboardingChecklist.appInstalled,
          label: 'Install GitHub App',
          onClick: () => installGithubApp(selectedOrganizationUuid),
        },
        {
          done: onboardingChecklist.repoConnected,
          label: 'Connect a Repository',
          disabled: !onboardingChecklist.appInstalled,
          onClick: () => setConnectProjectModalOpen(true),
        },
        {
          done: onboardingChecklist.openrouterConnected,
          label: 'Connect OpenRouter',
          onClick: handleConnectOpenrouter,
        },
        {
          done: onboardingChecklist.promptCreated,
          label: 'Create a Prompt',
          href: routes.studio.prompts(selectedProjectUuid, true),
        },
        {
          done: onboardingChecklist.promptTested,
          label: 'Test a Prompt',
          href: routes.studio.prompts(selectedProjectUuid),
        },
        {
          done: onboardingChecklist.repoSynced,
          label: 'Sync your repository',
          disabled: !onboardingChecklist.repoConnected,
          onClick: async () => {
            try {
              await syncProject(selectedProjectUuid);
              setOnboardingChecklist((prev) => (!prev ? null : { ...prev, repoSynced: true }));
            } catch (error: any) {
              toast.error('Failed to sync project', {
                description: error?.message,
              });
            }
          },
        },
      ];

  const allItemsCompleted = items.every((item) => item.done);

  useEffect(() => {
    const prevOnboardingChecklist = onboardingChecklistRef.current;
    onboardingChecklistRef.current = onboardingChecklist;
    if (prevOnboardingChecklist === null && onboardingChecklist !== null && allItemsCompleted) {
      setOnboardingCompleted(true);
    }
  }, [onboardingChecklist, allItemsCompleted]);

  useEffect(() => {
    const prevAllItemsCompleted = prevAllItemsCompletedRef.current;

    if (onboardingChecklist && !prevAllItemsCompleted && allItemsCompleted && floating) {
      posthog.capture('onboarding_completed');
      toast.success('Onboarding completed!', {
        icon: <PartyPopper />,
        description: 'You have learned the basics of Agentsmith! Happy prompting!',
        duration: 6000,
        classNames: {
          icon: 'mr-2!',
        },
      });

      setTimeout(() => {
        setOnboardingCompleted(true);
      }, 3000);
    }

    prevAllItemsCompletedRef.current = allItemsCompleted;
  }, [allItemsCompleted, onboardingChecklist]);

  useEffect(() => {
    // use media query js to check if the screen is not mobile breakpoint, if not, set list expanded to true
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    if (mediaQuery.matches) {
      setListExpanded(true);
    }
  }, []);

  const isOnProjectPage = pathname === routes.studio.project(selectedProjectUuid);

  if (onboardingCompleted || !onboardingChecklist || (floating && isOnProjectPage)) {
    return null;
  }

  const percentageComplete = (items.filter((item) => item.done).length / items.length) * 100;

  return (
    <>
      <ConnectProjectModal
        open={connectProjectModalOpen}
        onOpenChange={(open) => {
          setConnectProjectModalOpen(open);
        }}
        defaultProjectUuid={selectedProjectUuid}
        onSubmit={() =>
          setOnboardingChecklist((prev) => (!prev ? null : { ...prev, repoConnected: true }))
        }
      />
      <Card
        className={cn(
          'gap-0',
          floating &&
            'max-sm:rounded-none max-sm:border-b-0 max-sm:border-l-0 max-sm:border-r-0 fixed max-sm:w-full w-[calc(100%-16px)] sm:w-auto bottom-0 right-0 sm:bottom-2 sm:right-2 z-50 py-2 sm:py-4 shadow-xl',
        )}
      >
        <CardHeader
          className="px-4 gap-2"
          onClick={floating ? () => setListExpanded(!listExpanded) : undefined}
        >
          <div className={cn('flex items-center justify-between', floating && 'cursor-pointer')}>
            <H4 className="text-md sm:text-lg">Continue Setup</H4>
            {floating && (
              <ChevronDown
                className={cn(
                  'max-sm:size-5 transition-transform',
                  listExpanded ? '' : '-rotate-90',
                )}
              />
            )}
          </div>
          <Progress
            className={cn('hidden sm:block', listExpanded && 'block')}
            value={percentageComplete}
          />
        </CardHeader>
        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-300 ease-in-out',
            listExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <CardContent className="px-4 overflow-hidden mr-4">
            <ul className="flex flex-col gap-2 sm:gap-4 pt-4 mb-2 sm:mb-0">
              {items.map((item) => (
                <li
                  onClick={() => trackOnboardingItemClick(item)}
                  key={item.label}
                  className="flex items-end gap-3 text-sm sm:text-base"
                >
                  {item.done ? (
                    <CheckIcon className="text-green-500 w-5 h-5" />
                  ) : (
                    <SquareIcon className="text-muted-foreground w-5 h-5 -mb-0.25" />
                  )}
                  {!item.done && item.href ? (
                    <Link className="text-primary underline underline-offset-4" href={item.href}>
                      {item.label}
                    </Link>
                  ) : !item.done && item.onClick && !item.disabled ? (
                    <Button
                      variant="link"
                      className="p-0 text-md sm:text-base h-auto font-normal underline"
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
          </CardContent>
        </div>
      </Card>
    </>
  );
};
