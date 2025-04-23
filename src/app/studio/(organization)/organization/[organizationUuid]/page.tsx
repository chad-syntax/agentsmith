import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { OrganizationPage } from '@/page-components/OrganizationPage';
import { notFound } from 'next/navigation';
import {
  GetInstallationRepositoriesResult,
  GetProjectRepositoriesForOrganizationResult,
} from '@/lib/GitHubService';

type OrganizationProps = {
  params: Promise<{ organizationUuid: string }>;
};

export default async function Organization(props: OrganizationProps) {
  const { organizationUuid } = await props.params;

  const supabase = await createClient();
  const agentsmith = new AgentsmithServices({ supabase });

  const organization =
    await agentsmith.services.organizations.getOrganizationData(organizationUuid);
  if (!organization) {
    return notFound();
  }

  // TODO maybe fetch all, not just active and render the installation status
  const activeGithubAppInstallation = await agentsmith.services.githubApp.getActiveInstallation(
    organization.id,
  );

  let projectRepositories: GetProjectRepositoriesForOrganizationResult = [];

  if (activeGithubAppInstallation?.installation_id) {
    projectRepositories = await agentsmith.services.githubApp.getProjectRepositoriesForOrganization(
      organization.id,
    );
  }

  return (
    <OrganizationPage
      organization={organization}
      githubAppInstallation={activeGithubAppInstallation}
      projectRepositories={projectRepositories}
    />
  );
}
