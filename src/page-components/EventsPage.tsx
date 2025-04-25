'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { routes } from '@/utils/routes';
import { H1, H2, P } from '@/components/typography';
import { Button } from '@/components/ui/button';
import { GetProjectDataResult } from '@/lib/ProjectsService';
import { GetEventsByProjectIdResult } from '@/lib/EventsService';

type EventsPageProps = {
  project: GetProjectDataResult;
  events: GetEventsByProjectIdResult;
};

export const EventsPage = (props: EventsPageProps) => {
  const { project, events } = props;

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

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

      <div className="mb-6">
        <H2>Project: {project.name}</H2>
      </div>

      {events.length === 0 ? (
        <div className="bg-background rounded-lg shadow-sm p-6 text-center">
          <P className="text-muted-foreground">No events found for this project.</P>
        </div>
      ) : (
        <div className="bg-background rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {events.map((event) => (
                <tr key={event.uuid} className="hover:bg-muted">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(event.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {event.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {event.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button variant="link" asChild className="p-0">
                      <Link href={routes.studio.eventDetail(project.uuid, event.uuid)}>
                        View Details
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
