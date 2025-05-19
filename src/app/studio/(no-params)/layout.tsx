import { redirect } from 'next/navigation';
import { createClient } from '&/supabase/server';
import { DesktopStudioMenu } from '@/components/studio-menu';
import { AuthProvider } from '@/providers/auth';
import { AppProvider } from '@/providers/app';
import { routes } from '@/utils/routes';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { StudioHeader } from '@/components/studio-header';

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout(props: DashboardLayoutProps) {
  const { children } = props;

  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  const { authUser } = await agentsmith.services.users.getAuthUser();

  if (!authUser) {
    redirect(routes.auth.signIn);
  }

  try {
    const agentsmithUser = await agentsmith.services.users.getAgentsmithUser(authUser.id);

    const userOrganizationData = await agentsmith.services.users.getUserOrganizationData();

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
          <div className="md:flex h-[calc(100vh-58px)]">
            <DesktopStudioMenu />
            <main className="pl-0 md:pl-12 flex-1 overflow-auto">{children}</main>
          </div>
        </AppProvider>
      </AuthProvider>
    );
  } catch (error) {
    console.error(error);
    redirect(routes.error('Failed to fetch user data'));
  }
}
