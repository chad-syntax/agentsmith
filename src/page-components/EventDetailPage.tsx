'use client';

import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { routes } from '@/utils/routes';
import { H1, H2, P } from '@/components/typography';
import { Button } from '@/components/ui/button';
import { GetEventByUuidResult } from '@/lib/EventsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from '@/app/__generated__/supabase.types';
import ReactDiffViewer from 'react-diff-viewer-continued-react19';
import { isPromptLikeSyncChange, SyncChange } from '@/lib/sync/GitHubSyncInstance';
import { DisplayTime } from '@/components/display-time';
import { isProd } from '@/utils/is-env';

type EventDetailPageProps = {
  event: NonNullable<GetEventByUuidResult>;
};

export const EventDetailPage = (props: EventDetailPageProps) => {
  const { event } = props;

  const projectUuid = event.projects?.uuid; // Use optional chaining as project might not always be linked

  const severityColor = (severity: Database['public']['Enums']['agentsmith_event_severity']) => {
    switch (severity) {
      case 'ERROR':
        return 'border border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400';
      case 'WARN':
        return 'border border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'INFO':
        return 'border border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'DEBUG':
      default:
        return 'border border-gray-500/50 bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  if (!event || !projectUuid) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center">
          <H1>Event Details</H1>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm text-center">
          <P className="text-muted-foreground">Event not found or project link missing.</P>
        </div>
      </div>
    );
  }

  const eventDetails = event.details as any; // TODO: harden type

  const syncChanges = (eventDetails?.syncChanges ?? []) as SyncChange[];

  return (
    <div className="p-6">
      <div className="mb-2 flex items-center">
        <Button
          variant="link"
          asChild
          className="mr-4 text-primary hover:text-primary/90 flex items-center p-0"
        >
          <Link href={routes.studio.events(projectUuid)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Events
          </Link>
        </Button>
      </div>
      <H1 className="mb-6">Event Details</H1>

      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <P className="text-sm text-muted-foreground">Project</P>
                <div className="mt-2 font-medium">{event.projects?.name || 'N/A'}</div>
              </div>
              <div>
                <P className="text-sm text-muted-foreground">Type</P>
                <div className="mt-2 font-medium">{event.type}</div>
              </div>
              <div>
                <P className="text-sm text-muted-foreground">Name</P>
                <div className="mt-2 font-medium">{event.name}</div>
              </div>
              <div>
                <P className="text-sm text-muted-foreground">Severity</P>
                <div className="mt-2 font-medium">
                  <div
                    className={`px-2 py-1 text-xs font-semibold rounded-full inline-block ${severityColor(
                      event.severity,
                    )}`}
                  >
                    {event.severity}
                  </div>
                </div>
              </div>
              <div>
                <P className="text-sm text-muted-foreground">Date</P>
                <div className="mt-2 font-medium">
                  <DisplayTime
                    dateTime={event.created_at}
                    formatString="MMM d, yyyy h:mm:ss.SSS a"
                    skeletonClassName="h-[24px] w-[250px]"
                  />
                </div>
              </div>
              <div>
                <P className="text-sm text-muted-foreground">Description</P>
                <div className="mt-2 font-medium">{event.description}</div>
              </div>
              {eventDetails?.pullRequestDetail?.htmlUrl && (
                <div className="text-blue-500">
                  <P className="text-sm text-muted-foreground">Pull Request</P>
                  <div className="mt-2 font-medium">
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={eventDetails.pullRequestDetail.htmlUrl}
                      className="flex items-center hover:underline"
                    >
                      View Pull Request (#{eventDetails.pullRequestDetail.number})
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </div>
                </div>
              )}
              {eventDetails?.source && eventDetails?.destination && (
                <div>
                  <P className="text-sm text-muted-foreground">Source → Destination</P>
                  <div className="mt-2 font-medium">
                    {eventDetails.source} → {eventDetails.destination}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <H2>Changes</H2>
        {syncChanges.length === 0 && <P>No changes were made.</P>}
        {syncChanges.map((syncChange, index) => {
          const isPromptLike = isPromptLikeSyncChange(syncChange);

          return (
            <Card key={`${syncChange.oldSha}-${syncChange.newSha}-${index}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {syncChange.type}
                  {isPromptLike && (
                    <span>
                      <span className="text-destructive">{syncChange.promptSlug}</span>
                      <span className="px-0.5">@</span>
                      {syncChange.promptVersion}
                    </span>
                  )}
                  <span className="text-accent">{syncChange.entity}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ReactDiffViewer
                  oldValue={syncChange.oldContent ?? ''}
                  newValue={syncChange.newContent ?? ''}
                />
              </CardContent>
            </Card>
          );
        })}

        {!isProd && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(event.details, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export const EventDetailPageSkeleton = () => (
  <div className="p-6">
    <div className="mb-2 flex items-center">
      <Button
        variant="link"
        disabled
        className="mr-4 text-primary hover:text-primary/90 flex items-center p-0"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Events
      </Button>
    </div>
    <H1 className="mb-6">Event Details</H1>

    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <P className="text-sm text-muted-foreground">Project</P>
              <div className="mt-2 font-medium">
                <div className="bg-muted rounded w-32 h-6 animate-pulse">&nbsp;</div>
              </div>
            </div>
            <div>
              <P className="text-sm text-muted-foreground">Type</P>
              <div className="mt-2 font-medium">
                <div className="bg-muted rounded w-24 h-6 animate-pulse">&nbsp;</div>
              </div>
            </div>
            <div>
              <P className="text-sm text-muted-foreground">Name</P>
              <div className="mt-2 font-medium">
                <div className="bg-muted rounded w-40 h-6 animate-pulse">&nbsp;</div>
              </div>
            </div>
            <div>
              <P className="text-sm text-muted-foreground">Severity</P>
              <div className="mt-2 font-medium">
                <div className="bg-muted rounded w-16 h-5 animate-pulse">&nbsp;</div>
              </div>
            </div>
            <div>
              <P className="text-sm text-muted-foreground">Date</P>
              <div className="mt-2 font-medium">
                <div className="bg-muted rounded w-48 h-6 animate-pulse">&nbsp;</div>
              </div>
            </div>
            <div>
              <P className="text-sm text-muted-foreground">Description</P>
              <div className="mt-2 font-medium">
                <div className="bg-muted rounded w-56 h-6 animate-pulse">&nbsp;</div>
              </div>
            </div>
            <div>
              <P className="text-sm text-muted-foreground">Pull Request</P>
              <div className="mt-2 font-medium">
                <div className="bg-muted rounded w-48 h-6 animate-pulse">&nbsp;</div>
              </div>
            </div>
            <div>
              <P className="text-sm text-muted-foreground">Source → Destination</P>
              <div className="mt-2 font-medium">
                <div className="bg-muted rounded w-40 h-6 animate-pulse">&nbsp;</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <H2>Changes</H2>
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="bg-muted rounded w-32 h-6 animate-pulse">&nbsp;</div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded w-full h-32 animate-pulse">&nbsp;</div>
        </CardContent>
      </Card>
    </div>
  </div>
);
