'use client';

import { GetProjectDataResult } from '@/lib/ProjectsService';
import { useApp } from '@/providers/app';
import { Info, CheckCircle, AlertCircle } from 'lucide-react';
import { ElementType } from 'react';
import { SyncProjectButton } from './sync-project-button';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

export type SyncStatusAlertProps = {
  events: NonNullable<GetProjectDataResult>['agentsmith_events'];
};

export const SyncStatusAlert = (props: SyncStatusAlertProps) => {
  const { events } = props;

  const { selectedProjectUuid } = useApp();

  if (!events || events.length === 0) {
    return (
      <Alert variant="warning" className="mb-4">
        <AlertTitle>Sync Status</AlertTitle>
        <AlertDescription>
          Project has not been synced yet. Connect a repository to get started!
        </AlertDescription>
      </Alert>
    );
  }

  const latestEvent = events[0];
  let alertVariant: 'default' | 'destructive' = 'default';
  let alertTitle = 'Sync Status';
  let alertDescription = '';
  let IconComponent: ElementType = Info;

  if (latestEvent.type === 'SYNC_COMPLETE') {
    alertDescription = `Last successful sync on ${new Date(latestEvent.created_at).toLocaleString()}`;
    IconComponent = CheckCircle;
  } else if (latestEvent.type === 'SYNC_ERROR') {
    alertVariant = 'destructive';
    alertDescription = `Last sync failed on ${new Date(latestEvent.created_at).toLocaleString()}`;
    IconComponent = AlertCircle;
  } else if (latestEvent.type === 'SYNC_START') {
    alertDescription = `Sync started on ${new Date(latestEvent.created_at).toLocaleString()}`;
    IconComponent = Info;
  } else {
    // Not a relevant event type to display an alert for
    return null;
  }

  return (
    <Alert variant={alertVariant} className="mb-4">
      <IconComponent className="h-4 w-4" />
      <AlertTitle>{alertTitle}</AlertTitle>
      <AlertDescription>{alertDescription}</AlertDescription>
      <SyncProjectButton
        size="lg"
        className="ml-6 mt-2 min-w-[128px]"
        projectUuid={selectedProjectUuid}
      >
        Sync Project
      </SyncProjectButton>
    </Alert>
  );
};
