import { redirect } from 'next/navigation';
import { createClient } from '&/supabase/server';
import { AgentsmithUser } from '@/providers/auth';
import { routes } from '@/utils/routes';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { User } from '@supabase/supabase-js';
import { GetUserOrganizationDataResult } from '@/lib/UsersService';
import { StudioApp } from '@/app/studio-app';

type DashboardLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    organizationUuid: string;
  }>;
};

export default async function DashboardLayout(props: DashboardLayoutProps) {
  const { children, params } = props;

  const { organizationUuid } = await params;

  const supabase = await createClient();

  const { services, logger } = new AgentsmithServices({ supabase });

  let redirectUrl: string | null = null;
  let authUser: User | null = null;
  let agentsmithUser: AgentsmithUser | null = null;
  let userOrganizationData: GetUserOrganizationDataResult | null = null;
  let firstOrganizationProject:
    | GetUserOrganizationDataResult['organization_users'][number]['organizations']['projects'][number]
    | undefined;

  try {
    const userData = await services.users.getAuthUser();

    authUser = userData.authUser;

    if (!authUser) {
      redirectUrl = routes.auth.signIn;
    }

    if (authUser) {
      agentsmithUser = await services.users.getAgentsmithUser(authUser.id);

      userOrganizationData = await services.users.getUserOrganizationData();

      const organization = await services.organizations.getOrganizationData(organizationUuid);

      firstOrganizationProject = organization?.projects[0];

      if (!firstOrganizationProject) {
        redirectUrl = routes.error('No projects found');
      }
    }
  } catch (error) {
    logger.error(error);
    redirectUrl = routes.error('Failed to fetch user data');
  } finally {
    if (redirectUrl) {
      redirect(redirectUrl);
    }
  }

  if (!authUser || !agentsmithUser || !userOrganizationData || !firstOrganizationProject) {
    return null;
  }

  return (
    <StudioApp
      authUser={authUser}
      agentsmithUser={agentsmithUser}
      selectedProjectUuid={firstOrganizationProject.uuid}
      selectedOrganizationUuid={organizationUuid}
      userOrganizationData={userOrganizationData}
      children={children}
    />
  );
}
