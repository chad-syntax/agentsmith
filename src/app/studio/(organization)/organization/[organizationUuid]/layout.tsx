import { redirect } from 'next/navigation';
import { createClient } from '&/supabase/server';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { AuthProvider } from '@/app/providers/auth';
import { AppProvider } from '@/app/providers/app';
import { routes } from '@/utils/routes';
import { AgentsmithServices } from '@/lib/AgentsmithServices';

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

  try {
    const { authUser } = await agentsmith.services.users.initialize();

    if (!authUser) {
      redirect(routes.auth.signIn);
    }

    const agentsmithUser = await agentsmith.services.users.getAgentsmithUser(
      authUser.id
    );

    const userOrganizationData =
      await agentsmith.services.users.getUserOrganizationData();

    const organization =
      await agentsmith.services.organizations.getOrganizationData(
        organizationUuid
      );

    const firstOrganizationProject = organization?.projects[0];

    if (!firstOrganizationProject) {
      redirect(routes.error('No projects found'));
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
  } catch (error) {
    console.error(error);
    redirect(routes.error('Failed to fetch user data'));
  }
}
