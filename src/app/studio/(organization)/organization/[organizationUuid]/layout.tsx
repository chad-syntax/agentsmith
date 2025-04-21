import { redirect } from 'next/navigation';
import { createClient } from '&/supabase/server';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { AgentsmithUser, AuthProvider } from '@/app/providers/auth';
import { AppProvider } from '@/app/providers/app';
import { routes } from '@/utils/routes';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { User } from '@supabase/supabase-js';
import { GetUserOrganizationDataResult } from '@/lib/UsersService';

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

  const agentsmith = new AgentsmithServices({ supabase });

  let redirectUrl: string | null = null;
  let authUser: User | null = null;
  let agentsmithUser: AgentsmithUser | null = null;
  let userOrganizationData: GetUserOrganizationDataResult | null = null;
  let firstOrganizationProject:
    | GetUserOrganizationDataResult['organization_users'][number]['organizations']['projects'][number]
    | undefined;

  try {
    const userData = await agentsmith.services.users.initialize();

    authUser = userData.authUser;

    if (!authUser) {
      redirectUrl = routes.auth.signIn;
    }

    if (authUser) {
      agentsmithUser = await agentsmith.services.users.getAgentsmithUser(authUser.id);

      userOrganizationData = await agentsmith.services.users.getUserOrganizationData();

      const organization =
        await agentsmith.services.organizations.getOrganizationData(organizationUuid);

      firstOrganizationProject = organization?.projects[0];

      if (!firstOrganizationProject) {
        redirectUrl = routes.error('No projects found');
      }
    }
  } catch (error) {
    console.error(error);
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
    <AuthProvider
      user={authUser}
      agentsmithUser={agentsmithUser ?? undefined}
      organizationData={userOrganizationData}
    >
      <AppProvider
        selectedProjectUuid={firstOrganizationProject.uuid}
        selectedOrganizationUuid={organizationUuid}
        userOrganizationData={userOrganizationData}
      >
        <div className="flex h-screen">
          <DashboardSidebar userOrganizationData={userOrganizationData} />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </AppProvider>
    </AuthProvider>
  );
}
