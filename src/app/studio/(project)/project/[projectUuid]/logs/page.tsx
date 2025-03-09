import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { LogsPage } from '@/page-components/LogsPage';

type LogsProps = {
  params: Promise<{ projectUuid: string }>;
};

export default async function Logs(props: LogsProps) {
  const { projectUuid } = await props.params;

  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  // Get the first project
  const project =
    await agentsmith.services.projects.getProjectData(projectUuid);

  // If no project exists, pass empty logs array
  const logs = project
    ? await agentsmith.services.llmLogs.getLogsByProjectId(project.id)
    : [];

  return <LogsPage project={project} logs={logs} />;
}
