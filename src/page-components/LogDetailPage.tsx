import Link from 'next/link';
import { format } from 'date-fns';
import { IconArrowLeft } from '@tabler/icons-react';
import { getLogByUuid } from '@/lib/logs';

type LogDetailPageProps = {
  log: Awaited<ReturnType<typeof getLogByUuid>>;
};

export const LogDetailPage = (props: LogDetailPageProps) => {
  const { log } = props;

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
          <Link
            href="/studio/logs"
            className="mr-4 text-blue-600 hover:text-blue-800 flex items-center"
          >
            <IconArrowLeft className="w-4 h-4 mr-1" />
            Back to Logs
          </Link>
          <h1 className="text-2xl font-bold">Log Details</h1>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <p className="text-gray-500">Log not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center">
        <Link
          href="/studio/logs"
          className="mr-4 text-blue-600 hover:text-blue-800 flex items-center"
        >
          <IconArrowLeft className="w-4 h-4 mr-1" />
          Back to Logs
        </Link>
        <h1 className="text-2xl font-bold">Log Details</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Project</p>
              <p className="font-medium">{log.projects.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    log.end_time
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {log.end_time ? 'Completed' : 'Running'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Start Time</p>
              <p className="font-medium">{formatDate(log.start_time)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">End Time</p>
              <p className="font-medium">
                {log.end_time ? formatDate(log.end_time) : 'Still running'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-medium">
                {getDuration(log.start_time, log.end_time)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Prompt Version</p>
              <p className="font-medium">{log.prompt_versions?.version}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Variables</h2>
          <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
            {JSON.stringify(log.prompt_variables, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Raw Input</h2>
          <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
            {JSON.stringify(log.raw_input, null, 2)}
          </pre>
        </div>

        {log.raw_output && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Raw Output</h2>
            <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(log.raw_output, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
