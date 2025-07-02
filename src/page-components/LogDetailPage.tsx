import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { routes } from '@/utils/routes';
import { H1, H2, P } from '@/components/typography';
import { Button } from '@/components/ui/button';
import { GetLogByUuidResult } from '@/lib/LLMLogsService';
import { JsonEditor } from '@/components/editors/json-editor';
import { DisplayTime } from '@/components/display-time';
import { LogSourceBadge } from '@/components/log-source-badge';

type LogDetailPageProps = {
  log: NonNullable<GetLogByUuidResult>;
};

export const LogDetailPage = (props: LogDetailPageProps) => {
  const { log } = props;

  const projectUuid = log.projects.uuid;

  // Calculate duration if both start and end time exist
  const getDuration = (startTime: string, endTime: string | null) => {
    if (endTime) {
      const duration = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000;
      return `${duration.toFixed(4)} seconds`;
    }
    return 'In progress';
  };

  if (!log) {
    return (
      <div className="p-6">
        <div className="mb-2 flex items-center">
          <Button
            variant="link"
            asChild
            className="mr-4 text-primary hover:text-primary/90 flex items-center p-0"
          >
            <Link href={routes.studio.logs(projectUuid)}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Logs
            </Link>
          </Button>
        </div>
        <H1 className="mb-6">Log Details</H1>
        <div className="bg-card p-6 rounded-lg shadow-sm text-center">
          <P className="text-muted-foreground">Log not found.</P>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-2 flex items-center">
        <Button
          variant="link"
          asChild
          className="mr-4 text-primary hover:text-primary/90 flex items-center p-0"
        >
          <Link href={routes.studio.logs(projectUuid)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Logs
          </Link>
        </Button>
      </div>

      <H1 className="mb-6">Log Details</H1>

      <div className="space-y-6">
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <H2 className="mb-4">Overview</H2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <P className="text-sm text-muted-foreground">Project</P>
              <div className="mt-2 font-medium">{log.projects.name}</div>
            </div>
            <div>
              <P className="text-sm text-muted-foreground">Status</P>
              <div className="mt-2 font-medium">
                <div
                  className={`px-2 py-1 text-xs font-semibold rounded-full inline-block ${
                    log.end_time
                      ? 'border border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400'
                      : 'border border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                  }`}
                >
                  {log.end_time ? 'Completed' : 'Running'}
                </div>
              </div>
            </div>
            <div>
              <P className="text-sm text-muted-foreground">Prompt</P>
              <div className="mt-2 font-medium">
                {log.prompt_versions ? (
                  <>
                    {log.prompt_versions.prompts?.uuid && log.prompt_versions.prompts?.name ? (
                      <Link
                        href={routes.studio.promptDetail(
                          projectUuid,
                          log.prompt_versions.prompts.uuid,
                        )}
                        className="hover:text-primary hover:underline"
                      >
                        {log.prompt_versions.prompts.name}
                      </Link>
                    ) : (
                      log.prompt_versions.prompts?.name || 'N/A'
                    )}
                    {' @ '}
                    {log.prompt_versions.uuid && log.prompt_versions.version ? (
                      <Link
                        href={routes.studio.editPromptVersion(
                          projectUuid,
                          log.prompt_versions.uuid,
                        )}
                        className="hover:text-primary hover:underline"
                      >
                        {log.prompt_versions.version}
                      </Link>
                    ) : (
                      log.prompt_versions.version || 'N/A'
                    )}
                  </>
                ) : (
                  'N/A'
                )}
              </div>
            </div>
            <div>
              <P className="text-sm text-muted-foreground">Source</P>
              <div className="mt-2 font-medium">
                <LogSourceBadge source={log.source} />
              </div>
            </div>
            <div>
              <P className="text-sm text-muted-foreground">Start Time</P>
              <div className="mt-2 font-medium">
                <DisplayTime
                  skeletonClassName="h-[24px]"
                  dateTime={log.start_time}
                  formatString="MMM d, yyyy h:mm:ss.SSS a"
                />
              </div>
            </div>
            <div>
              <P className="text-sm text-muted-foreground">End Time</P>
              <div className="mt-2 font-medium">
                {log.end_time ? (
                  <DisplayTime
                    skeletonClassName="h-[24px]"
                    dateTime={log.end_time}
                    formatString="MMM d, yyyy h:mm:ss.SSS a"
                  />
                ) : (
                  'Still running'
                )}
              </div>
            </div>
            <div>
              <P className="text-sm text-muted-foreground">Duration</P>
              <div className="mt-2 font-medium">{getDuration(log.start_time, log.end_time)}</div>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-sm">
          <H2 className="mb-4">Variables</H2>
          <JsonEditor readOnly value={log.prompt_variables as any} />
        </div>

        <div className="bg-card p-6 rounded-lg shadow-sm">
          <H2 className="mb-4">Raw Input</H2>
          <JsonEditor readOnly value={log.raw_input as any} />
        </div>

        {log.raw_output && (
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <H2 className="mb-4">Raw Output</H2>
            <JsonEditor readOnly value={log.raw_output as any} />
          </div>
        )}
      </div>
    </div>
  );
};

export const LogDetailPageSkeleton = () => (
  <div className="p-6">
    <div className="mb-2 flex items-center">
      <Button
        variant="link"
        disabled
        className="mr-4 text-primary hover:text-primary/90 flex items-center p-0"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Logs
      </Button>
    </div>
    <H1 className="mb-6">Log Details</H1>

    <div className="space-y-6">
      <div className="bg-card p-6 rounded-lg shadow-sm">
        <H2 className="mb-4">Overview</H2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <P className="text-sm text-muted-foreground">Project</P>
            <div className="mt-2 font-medium">
              <div className="bg-muted rounded w-32 h-6 animate-pulse">&nbsp;</div>
            </div>
          </div>
          <div>
            <P className="text-sm text-muted-foreground">Status</P>
            <div className="mt-2 font-medium">
              <div className="bg-muted rounded w-20 h-6 animate-pulse">&nbsp;</div>
            </div>
          </div>
          <div>
            <P className="text-sm text-muted-foreground">Prompt</P>
            <div className="mt-2 font-medium">
              <div className="bg-muted rounded w-48 h-6 animate-pulse">&nbsp;</div>
            </div>
          </div>
          <div>
            <P className="text-sm text-muted-foreground">Source</P>
            <div className="mt-2 font-medium">
              <div className="bg-muted rounded w-48 h-6 animate-pulse">&nbsp;</div>
            </div>
          </div>
          <div>
            <P className="text-sm text-muted-foreground">Start Time</P>
            <div className="mt-2 font-medium">
              <div className="bg-muted rounded w-40 h-6 animate-pulse">&nbsp;</div>
            </div>
          </div>
          <div>
            <P className="text-sm text-muted-foreground">End Time</P>
            <div className="mt-2 font-medium">
              <div className="bg-muted rounded w-40 h-6 animate-pulse">&nbsp;</div>
            </div>
          </div>
          <div>
            <P className="text-sm text-muted-foreground">Duration</P>
            <div className="mt-2 font-medium">
              <div className="bg-muted rounded w-24 h-6 animate-pulse">&nbsp;</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg shadow-sm">
        <H2 className="mb-4">Variables</H2>
        <div className="bg-muted rounded w-full h-32 animate-pulse">&nbsp;</div>
      </div>

      <div className="bg-card p-6 rounded-lg shadow-sm">
        <H2 className="mb-4">Raw Input</H2>
        <div className="bg-muted rounded w-full h-32 animate-pulse">&nbsp;</div>
      </div>

      <div className="bg-card p-6 rounded-lg shadow-sm">
        <H2 className="mb-4">Raw Output</H2>
        <div className="bg-muted rounded w-full h-32 animate-pulse">&nbsp;</div>
      </div>
    </div>
  </div>
);
