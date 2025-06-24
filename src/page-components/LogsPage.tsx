'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { routes } from '@/utils/routes';
import { H1, P } from '@/components/typography';
import { GetProjectDataResult } from '@/lib/ProjectsService';
import { GetLogsByProjectIdResult } from '@/lib/LLMLogsService';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { DisplayTime } from '@/components/display-time';

type LogsPageProps = {
  project: GetProjectDataResult;
  logs: GetLogsByProjectIdResult;
};

export const LogsPage = (props: LogsPageProps) => {
  const { project, logs } = props;
  const router = useRouter();

  if (!project) {
    return (
      <div className="p-6">
        <H1 className="mb-4">Logs</H1>
        <div className="bg-background rounded-lg shadow-sm p-6 text-center">
          <P className="text-muted-foreground">No projects found. Create a project first.</P>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <H1 className="mb-4">Logs</H1>

      {logs.length === 0 ? (
        <div className="bg-background rounded-lg shadow-sm p-6 text-center">
          <P className="text-muted-foreground">No logs found for this project.</P>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Date
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Prompt Name
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Prompt Version
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Duration
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              // Calculate duration if both start and end time exist
              const duration = log.end_time
                ? (
                    (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) /
                    1000
                  ).toFixed(2) + 's'
                : 'In progress';

              // Determine status based on end_time
              const status = log.end_time ? 'Completed' : 'Running';

              return (
                <TableRow
                  key={log.uuid}
                  className="hover:bg-muted cursor-pointer"
                  onClick={() => router.push(routes.studio.logDetail(project.uuid, log.uuid))}
                >
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <DisplayTime dateTime={log.created_at} formatString="MMM d, yyyy h:mm a" />
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        log.end_time
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {status}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {log.prompt_versions?.prompts?.uuid && log.prompt_versions?.prompts?.name ? (
                      <Link
                        href={routes.studio.promptDetail(
                          project.uuid,
                          log.prompt_versions.prompts.uuid,
                        )}
                        className="hover:text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {log.prompt_versions.prompts.name}
                      </Link>
                    ) : (
                      log.prompt_versions?.prompts?.name || 'N/A'
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {log.prompt_versions?.uuid && log.prompt_versions?.version ? (
                      <Link
                        href={routes.studio.editPromptVersion(
                          project.uuid,
                          log.prompt_versions.uuid,
                        )}
                        className="hover:text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {log.prompt_versions.version}
                      </Link>
                    ) : (
                      log.prompt_versions?.version || 'N/A'
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {duration}
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

export const LogsPageSkeleton = () => (
  <div className="p-6">
    <H1 className="mb-4">Logs</H1>

    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Date
          </TableHead>
          <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Status
          </TableHead>
          <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Prompt Name
          </TableHead>
          <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Prompt Version
          </TableHead>
          <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Duration
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[1, 2, 3].map((i) => (
          <TableRow key={i} className="hover:bg-muted">
            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
              <div className="bg-muted rounded w-32 h-4 animate-pulse">&nbsp;</div>
            </TableCell>
            <TableCell className="px-6 py-4 whitespace-nowrap">
              <div className="bg-muted rounded w-20 h-5 animate-pulse">&nbsp;</div>
            </TableCell>
            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
              <div className="bg-muted rounded w-40 h-4 animate-pulse">&nbsp;</div>
            </TableCell>
            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
              <div className="bg-muted rounded w-16 h-4 animate-pulse">&nbsp;</div>
            </TableCell>
            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
              <div className="bg-muted rounded w-12 h-4 animate-pulse">&nbsp;</div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
