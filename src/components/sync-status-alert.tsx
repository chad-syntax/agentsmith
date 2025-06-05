'use client';

import { GetProjectDataResult } from '@/lib/ProjectsService';
import { useApp } from '@/providers/app';
import { Info, CheckCircle, AlertCircle } from 'lucide-react';
import { ElementType } from 'react';
import { SyncProjectButton } from './sync-project-button';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { DisplayTime } from './display-time';

export type SyncStatusAlertProps = {
  events: NonNullable<GetProjectDataResult>['agentsmith_events'];
  isConnected: boolean;
};

export const SyncStatusAlert = (props: SyncStatusAlertProps) => {
  const { events, isConnected } = props;

  const { selectedProjectUuid } = useApp();

  if (!isConnected) {
    return null;
  }

  if (!events || events.length === 0) {
    return (
      <Alert variant="warning" className="mb-4">
        <AlertTitle>Sync Status</AlertTitle>
        <AlertDescription>
          Project has not been synced yet.
          <SyncProjectButton
            size="lg"
            className="ml-0 mt-2 min-w-[128px]"
            projectUuid={selectedProjectUuid}
          />
        </AlertDescription>
      </Alert>
    );
  }

  const latestEvent = events[0];
  const alertTime = new Date(latestEvent.created_at).toLocaleString();
  let alertVariant: 'default' | 'destructive' = 'default';
  let alertTitle = 'Sync Status';
  let alertDescription = '';
  let IconComponent: ElementType = Info;

  if (latestEvent.type === 'SYNC_COMPLETE') {
    alertDescription = `Last successful sync on`;
    IconComponent = CheckCircle;
  } else if (latestEvent.type === 'SYNC_ERROR') {
    alertVariant = 'destructive';
    alertDescription = `Last sync failed on`;
    IconComponent = AlertCircle;
  } else if (latestEvent.type === 'SYNC_START') {
    alertDescription = `Sync started on`;
    IconComponent = Info;
  } else {
    // Not a relevant event type to display an alert for
    return null;
  }

  return (
    <Alert variant={alertVariant} className="mb-4">
      <IconComponent className="h-4 w-4" />
      <AlertTitle>{alertTitle}</AlertTitle>
      <AlertDescription>
        <div>
          <span>{alertDescription}</span>&nbsp;
          <DisplayTime dateTime={alertTime} />
        </div>
        <SyncProjectButton
          size="lg"
          className="ml-0 mt-2 min-w-[128px]"
          projectUuid={selectedProjectUuid}
        >
          Sync Project
        </SyncProjectButton>
      </AlertDescription>
    </Alert>
  );
};
