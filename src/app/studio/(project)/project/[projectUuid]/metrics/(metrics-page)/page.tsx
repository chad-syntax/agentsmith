import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { MetricsPage } from '@/page-components/MetricsPage/MetricsPage';
import { NoMetricsPageAccess } from '@/page-components/NoMetricsPageAccess';
import { routes } from '@/utils/routes';
import { redirect } from 'next/navigation';

type MetricsProps = {
  params: Promise<{ projectUuid: string }>;
};

export default async function Metrics(props: MetricsProps) {
  const { projectUuid } = await props.params;

  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  // Get the project data
  const project = await agentsmith.services.projects.getProjectDataByUuid(projectUuid);

  if (!project) {
    redirect(routes.error('Project not found, cannot load metrics.'));
  }

  const organizationTier = await agentsmith.services.organizations.getOrganizationTierData(
    project.organizations.uuid,
  );

  if (!organizationTier) {
    redirect(routes.error('Organization not found, cannot load metrics.'));
  }

  const hasMetricsPageAccess = organizationTier.metrics_page_access;

  if (!hasMetricsPageAccess) {
    return <NoMetricsPageAccess organizationTier={organizationTier} />;
  }

  return <MetricsPage project={project} />;
}
