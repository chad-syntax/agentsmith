import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { LogsPage } from '@/page-components/LogsPage/LogsPage';
import { routes } from '@/utils/routes';
import { redirect } from 'next/navigation';

type LogsProps = {
  params: Promise<{ projectUuid: string }>;
};

export default async function Logs(props: LogsProps) {
  const { projectUuid } = await props.params;

  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  // Get the project data
  const project = await agentsmith.services.projects.getProjectDataByUuid(projectUuid);

  if (!project) {
    redirect(routes.error('Project not found, cannot load logs.'));
  }

  // Get available filters for the last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  const availableFilters = await agentsmith.services.metrics.getAvailableFilters(
    project.id,
    startDate,
    endDate,
  );

  return <LogsPage project={project} availableFilters={availableFilters} />;
}
