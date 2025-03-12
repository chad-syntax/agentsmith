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

  const organization = await agentsmith.services.organizations.getOrganizationData(organizationUuid);
  if (!organization) {
    return notFound();
  }

  const githubAppInstallation = await agentsmith.services.github.getInstallation(organization.id);

  let installationRepositories: GetInstallationRepositoriesResult = [];
  let projectRepositories: GetProjectRepositoriesForOrganizationResult = [];

  if (githubAppInstallation?.installation_id) {
    installationRepositories = await agentsmith.services.github.getInstallationRepositories(
      githubAppInstallation.installation_id
    );

    projectRepositories = await agentsmith.services.github.getProjectRepositoriesForOrganization(
      organization.id
    );
  }

  return (
    <OrganizationPage
      organization={organization}
      githubAppInstallation={githubAppInstallation}
      installationRepositories={installationRepositories}
      projectRepositories={projectRepositories}
    />
  );
}
