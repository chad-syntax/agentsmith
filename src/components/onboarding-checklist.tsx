'use client';

import { CheckIcon, ChevronDown, SquareIcon } from 'lucide-react';
import { H4 } from '@/components/typography';
import { cn } from '@/utils/shadcn';
import Link from 'next/link';
import { routes } from '@/utils/routes';
import { useApp } from '@/providers/app';
import { ConnectProjectModal } from './modals/connect-project';
import { useState } from 'react';
import { Button } from './ui/button';
import { installGithubApp, syncProject } from '@/app/actions/github';
import { connectOpenrouter } from '@/app/actions/openrouter';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from './ui/card';
import { Progress } from './ui/progress';

export const OnboardingChecklist = () => {
  const [connectProjectModalOpen, setConnectProjectModalOpen] = useState(false);
  const [listExpanded, setListExpanded] = useState(true);

  const {
    selectedProjectUuid,
    selectedOrganizationUuid,
    onboardingChecklist,
    setOnboardingChecklist,
  } = useApp();

  const handleConnectOpenrouter = async () => {
    const response = await connectOpenrouter(selectedOrganizationUuid);

    if (!response.success) {
      toast.error('Failed to connect OpenRouter, please try again or contact support.');
      return;
    }
  };

  const items = !onboardingChecklist
    ? []
    : [
        {
          done: onboardingChecklist.organizationRenamed,
          label: 'Name your organization',
          href: routes.studio.editOrganization(selectedOrganizationUuid),
        },
        {
          done: onboardingChecklist.appInstalled,
          label: 'Install GitHub App',
          onClick: () => installGithubApp(selectedOrganizationUuid),
        },
        {
          done: onboardingChecklist.repoConnected,
          label: 'Connect a Repository',
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
          href: routes.studio.prompts(selectedProjectUuid),
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

  if (allItemsCompleted) {
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
      <Card className="fixed w-[calc(100%-16px)] md:w-auto bottom-2 right-2 z-50 gap-0 py-4 shadow-xl">
        <CardHeader className="px-4 gap-2" onClick={() => setListExpanded(!listExpanded)}>
          <div className="flex items-center justify-between cursor-pointer">
            <H4 className="text-lg">Get Started</H4>
            <ChevronDown className={cn('transition-transform', listExpanded ? '' : '-rotate-90')} />
          </div>
          <Progress value={percentageComplete} />
        </CardHeader>
        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-300 ease-in-out',
            listExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <CardContent className="px-4 overflow-hidden mr-4">
            <ul className="flex flex-col gap-4 pt-4">
              {items.map((item, idx) => (
                <li key={item.label} className="flex items-end gap-3">
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
          </CardContent>
        </div>
      </Card>
    </>
  );
};
