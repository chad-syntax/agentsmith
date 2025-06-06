'use client';

import { useRouter } from 'next/navigation';
import { Check, X, AlertTriangle, Info, type LucideIcon, CircleFadingArrowUp } from 'lucide-react';
import { routes } from '@/utils/routes';
import { H1, P } from '@/components/typography';
import { GetProjectDataResult } from '@/lib/ProjectsService';
import { GetEventsByProjectIdResult } from '@/lib/EventsService';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { DisplayTime } from '@/components/display-time';

// Added event type to icon mapping
const eventTypeToIconMap: Record<string, LucideIcon> = {
  SYNC_START: CircleFadingArrowUp,
  SYNC_COMPLETE: Check,
  SYNC_ERROR: X,
  ALERT: AlertTriangle,
};

// Added event type to color mapping
const eventTypeToColorMap: Record<string, string> = {
  SYNC_START: 'text-blue-800',
  SYNC_COMPLETE: 'text-green-800',
  SYNC_ERROR: 'text-red-800',
  ALERT: 'text-yellow-800',
};

type EventsPageProps = {
  project: GetProjectDataResult;
  events: GetEventsByProjectIdResult;
};

export const EventsPage = (props: EventsPageProps) => {
  const { project, events } = props;
  const router = useRouter();

  if (!project) {
    return (
      <div className="p-6">
        <H1 className="mb-4">Events</H1>
        <div className="bg-background rounded-lg shadow-sm p-6 text-center">
          <P className="text-muted-foreground">No projects found. Create a project first.</P>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <H1 className="mb-4">Events</H1>
      {events.length === 0 ? (
        <div className="bg-background rounded-lg shadow-sm p-6 text-center">
          <P className="text-muted-foreground">No events found for this project.</P>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Date
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Severity
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Name
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => {
              const IconComponent = eventTypeToIconMap[event.type] || Info;
              const iconColor = eventTypeToColorMap[event.type] || 'text-gray-800';
              return (
                <TableRow
                  key={event.uuid}
                  className="hover:bg-muted cursor-pointer"
                  onClick={() => router.push(routes.studio.eventDetail(project.uuid, event.uuid))}
                >
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <DisplayTime
                      dateTime={event.created_at}
                      formatString="MMM d, yyyy h:mm:ss.SSS a"
                      skeletonClassName="h-[20px] w-[227px]"
                    />
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        event.severity === 'ERROR'
                          ? 'bg-red-100 text-red-800'
                          : event.severity === 'WARN'
                            ? 'bg-yellow-100 text-yellow-800'
                            : event.severity === 'INFO'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {event.severity}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground flex gap-2 items-center">
                    <IconComponent className={`size-5 ${iconColor}`} />
                    {event.name}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
