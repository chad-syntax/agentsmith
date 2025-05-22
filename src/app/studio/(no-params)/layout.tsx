import { redirect } from 'next/navigation';
import { createClient } from '&/supabase/server';
import { DesktopStudioSidebar } from '@/components/studio-sidebar';
import { AuthProvider } from '@/providers/auth';
import { AppProvider } from '@/providers/app';
import { routes } from '@/utils/routes';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { StudioHeader } from '@/components/studio-header';
import { cn } from '@/utils/shadcn';
import { IS_WAITLIST_REDIRECT_ENABLED, STUDIO_FULL_HEIGHT } from '@/app/constants';

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
      <AuthProvider user={authUser} agentsmithUser={agentsmithUser ?? undefined}>
        <AppProvider
          selectedProjectUuid={firstOrganizationProject.uuid}
          selectedOrganizationUuid={firstOrganization.uuid}
          userOrganizationData={userOrganizationData}
        >
          <StudioHeader />
          <div className={cn('md:flex', STUDIO_FULL_HEIGHT)}>
            <DesktopStudioSidebar />
            <main className="pl-0 md:pl-12 flex-1 overflow-auto">{children}</main>
          </div>
        </AppProvider>
      </AuthProvider>
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
