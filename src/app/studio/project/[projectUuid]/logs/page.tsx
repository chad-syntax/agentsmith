import { getFirstProject, getLogsByProjectId } from '@/lib/logs';
import { LogsPage } from '@/page-components/LogsPage';

export default async function Logs() {
  // Get the first project
  const project = await getFirstProject();

  // If no project exists, pass empty logs array
  const logs = project ? await getLogsByProjectId(project.id) : [];

  return <LogsPage project={project} logs={logs} />;
}
