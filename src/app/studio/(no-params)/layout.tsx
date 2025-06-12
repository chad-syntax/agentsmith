import { redirect } from 'next/navigation';
import { createClient } from '&/supabase/server';
import { routes } from '@/utils/routes';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { IS_WAITLIST_REDIRECT_ENABLED, STUDIO_FULL_HEIGHT } from '@/app/constants';
import { StudioApp } from '@/app/studio-app';

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout(props: DashboardLayoutProps) {
  const { children } = props;

  const supabase = await createClient();

  const { services, logger } = new AgentsmithServices({ supabase });

  const { authUser } = await services.users.getAuthUser();

  if (!authUser) {
    redirect(routes.auth.signIn);
  }

  let redirectUrl = null;

  try {
    const agentsmithUser = await services.users.getAgentsmithUser(authUser.id);

    if (!agentsmithUser?.studio_access && IS_WAITLIST_REDIRECT_ENABLED) {
      redirectUrl = routes.marketing.waitlisted;
    }

    const userOrganizationData = await services.users.getUserOrganizationData();

    const firstOrganization = userOrganizationData.organization_users[0].organizations;

    const firstOrganizationProject = firstOrganization.projects[0];

    return (
      <StudioApp
        authUser={authUser}
        agentsmithUser={agentsmithUser}
        selectedProjectUuid={firstOrganizationProject.uuid}
        selectedOrganizationUuid={firstOrganization.uuid}
        userOrganizationData={userOrganizationData}
        children={children}
      />
    );
  } catch (error) {
    logger.error(error);
    redirectUrl = routes.error('Failed to fetch user data');
  } finally {
    if (redirectUrl) {
      redirect(redirectUrl);
    }
  }
}
