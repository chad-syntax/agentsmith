import Link from 'next/link';
import { format } from 'date-fns';
import { getLogsByProjectId } from '@/lib/logs';
import { routes } from '@/utils/routes';
import { getProjectData } from '@/lib/projects';
import { H1, H2, P } from '@/components/typography';
import { Button } from '@/components/ui/button';

type LogsPageProps = {
  project: Awaited<ReturnType<typeof getProjectData>>;
  logs: Awaited<ReturnType<typeof getLogsByProjectId>>;
};

export const LogsPage = (props: LogsPageProps) => {
  const { project, logs } = props;

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  if (!project) {
    return (
      <div className="p-6">
        <H1 className="mb-4">Logs</H1>
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <P className="text-gray-500">
            No projects found. Create a project first.
          </P>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <H1 className="mb-4">Logs</H1>

      <div className="mb-6">
        <H2>Project: {project.name}</H2>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <P className="text-gray-500">No logs found for this project.</P>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => {
                // Calculate duration if both start and end time exist
                const duration = log.end_time
                  ? (
                      (new Date(log.end_time).getTime() -
                        new Date(log.start_time).getTime()) /
                      1000
                    ).toFixed(2) + 's'
                  : 'In progress';

                // Determine status based on end_time
                const status = log.end_time ? 'Completed' : 'Running';

                return (
                  <tr key={log.uuid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          log.end_time
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {duration}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="link" asChild className="p-0">
                        <Link
                          href={routes.studio.logDetail(project.uuid, log.uuid)}
                        >
                          View Details
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
