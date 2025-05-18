import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { GetProjectRepositoriesForOrganizationResult } from '@/lib/GitHubAppService';
import { SettingsPage } from '@/page-components/SettingsPage';

type SettingsProps = {
  params: Promise<{ organizationUuid: string }>;
};

export default async function Settings(props: SettingsProps) {
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
    <SettingsPage
      organization={organization}
      githubAppInstallation={activeGithubAppInstallation}
      projectRepositories={projectRepositories}
    />
  );
}
