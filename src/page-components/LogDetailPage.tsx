import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { routes } from '@/utils/routes';
import { H1, H2, P } from '@/components/typography';
import { Button } from '@/components/ui/button';
import { GetLogByUuidResult } from '@/lib/LLMLogsService';
import { JsonEditor } from '@/components/editors/json-editor';

type LogDetailPageProps = {
  log: NonNullable<GetLogByUuidResult>;
};

export const LogDetailPage = (props: LogDetailPageProps) => {
  const { log } = props;

  const projectUuid = log.projects.uuid;

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  // Calculate duration if both start and end time exist
  const getDuration = (startTime: string, endTime: string | null) => {
    if (endTime) {
      const duration = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000;
      return `${duration.toFixed(2)} seconds`;
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
              <P className="font-medium">{log.projects.name}</P>
            </div>
            <div>
              <P className="text-sm text-muted-foreground">Status</P>
              <P>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    log.end_time
                      ? 'border border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400'
                      : 'border border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                  }`}
                >
                  {log.end_time ? 'Completed' : 'Running'}
                </span>
              </P>
            </div>
            <div>
              <P className="text-sm text-muted-foreground">Start Time</P>
              <P className="font-medium">{formatDate(log.start_time)}</P>
            </div>
            <div>
              <P className="text-sm text-muted-foreground">End Time</P>
              <P className="font-medium">
                {log.end_time ? formatDate(log.end_time) : 'Still running'}
              </P>
            </div>
            <div>
              <P className="text-sm text-muted-foreground">Duration</P>
              <P className="font-medium">{getDuration(log.start_time, log.end_time)}</P>
            </div>
            <div>
              <P className="text-sm text-muted-foreground">Prompt Version</P>
              <P className="font-medium">{log.prompt_versions?.version}</P>
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
