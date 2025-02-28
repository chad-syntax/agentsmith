import Link from 'next/link';
import { format } from 'date-fns';
import { getFirstProject, getLogsByProjectId } from '@/lib/logs';

type LogsPageProps = {
  project: Awaited<ReturnType<typeof getFirstProject>>;
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
        <h1 className="text-2xl font-bold mb-4">Logs</h1>
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-500">
            No projects found. Create a project first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Logs</h1>

      <div className="mb-6">
        <h2 className="text-lg font-medium">Project: {project.name}</h2>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-500">No logs found for this project.</p>
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
                      <Link
                        href={`/studio/logs/${log.uuid}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </Link>
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
