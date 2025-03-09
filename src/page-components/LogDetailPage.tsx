import Link from 'next/link';
import { format } from 'date-fns';
import { IconArrowLeft } from '@tabler/icons-react';
import { routes } from '@/utils/routes';
import { H1, H2, P } from '@/components/typography';
import { Button } from '@/components/ui/button';
import { GetLogByUuidResult } from '@/lib/LLMLogsService';

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
      const duration =
        (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000;
      return `${duration.toFixed(2)} seconds`;
    }
    return 'In progress';
  };

  if (!log) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center">
          <Button
            variant="link"
            asChild
            className="mr-4 text-blue-600 hover:text-blue-800 flex items-center p-0"
          >
            <Link href={routes.studio.logs(projectUuid)}>
              <IconArrowLeft className="w-4 h-4 mr-1" />
              Back to Logs
            </Link>
          </Button>
          <H1>Log Details</H1>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <P className="text-gray-500">Log not found.</P>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center">
        <Button
          variant="link"
          asChild
          className="mr-4 text-blue-600 hover:text-blue-800 flex items-center p-0"
        >
          <Link href={routes.studio.logs(projectUuid)}>
            <IconArrowLeft className="w-4 h-4 mr-1" />
            Back to Logs
          </Link>
        </Button>
        <H1>Log Details</H1>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <H2 className="mb-4">Overview</H2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <P className="text-sm text-gray-500">Project</P>
              <P className="font-medium">{log.projects.name}</P>
            </div>
            <div>
              <P className="text-sm text-gray-500">Status</P>
              <P>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    log.end_time
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {log.end_time ? 'Completed' : 'Running'}
                </span>
              </P>
            </div>
            <div>
              <P className="text-sm text-gray-500">Start Time</P>
              <P className="font-medium">{formatDate(log.start_time)}</P>
            </div>
            <div>
              <P className="text-sm text-gray-500">End Time</P>
              <P className="font-medium">
                {log.end_time ? formatDate(log.end_time) : 'Still running'}
              </P>
            </div>
            <div>
              <P className="text-sm text-gray-500">Duration</P>
              <P className="font-medium">
                {getDuration(log.start_time, log.end_time)}
              </P>
            </div>
            <div>
              <P className="text-sm text-gray-500">Prompt Version</P>
              <P className="font-medium">{log.prompt_versions?.version}</P>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <H2 className="mb-4">Variables</H2>
          <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
            {JSON.stringify(log.prompt_variables, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <H2 className="mb-4">Raw Input</H2>
          <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
            {JSON.stringify(log.raw_input, null, 2)}
          </pre>
        </div>

        {log.raw_output && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <H2 className="mb-4">Raw Output</H2>
            <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(log.raw_output, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
