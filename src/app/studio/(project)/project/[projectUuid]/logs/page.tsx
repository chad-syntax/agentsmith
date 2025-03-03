import { getProjectData } from '@/lib/projects';
import { getLogsByProjectId } from '@/lib/logs';
import { LogsPage } from '@/page-components/LogsPage';

type LogsProps = {
  params: Promise<{ projectUuid: string }>;
};

export default async function Logs(props: LogsProps) {
  const { projectUuid } = await props.params;

  // Get the first project
  const project = await getProjectData(projectUuid);

  // If no project exists, pass empty logs array
  const logs = project ? await getLogsByProjectId(project.id) : [];

  return <LogsPage project={project} logs={logs} />;
}
