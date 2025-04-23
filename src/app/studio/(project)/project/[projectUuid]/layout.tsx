import { redirect } from 'next/navigation';
import { createClient } from '&/supabase/server';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { AuthProvider } from '@/app/providers/auth';
import { AppProvider } from '@/app/providers/app';
import { routes } from '@/utils/routes';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { GetUserOrganizationDataResult } from '@/lib/UsersService';

type DashboardLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    projectUuid: string;
  }>;
};

export default async function DashboardLayout(props: DashboardLayoutProps) {
  const { children, params } = props;

  const { projectUuid } = await params;

  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  const { authUser } = await agentsmith.services.users.getAuthUser();

  if (!authUser) {
    redirect(routes.auth.signIn);
  }

  const agentsmithUser = await agentsmith.services.users.getAgentsmithUser(authUser.id);

  let redirectUrl: string | null = null;

  let userOrganizationData: GetUserOrganizationDataResult | null = null;

  try {
    userOrganizationData = await agentsmith.services.users.getUserOrganizationData();
  } catch (error) {
    redirectUrl = routes.error('Failed to fetch user data');
  }

  if (!agentsmithUser || !userOrganizationData) {
    redirectUrl = routes.error('Failed to fetch user data');
  }

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  const selectedProject = userOrganizationData!.organization_users
    .flatMap((orgUser) => orgUser.organizations.projects)
    .find((project) => project.uuid === projectUuid);

  const selectedOrganization = userOrganizationData!.organization_users
    .flatMap((orgUser) => orgUser.organizations)
    .find((org) => org.projects.some((project) => project.uuid === projectUuid));

  if (!selectedProject || !selectedOrganization) {
    redirect(routes.studio.home);
  }

  return (
    <AuthProvider
      user={authUser}
      agentsmithUser={agentsmithUser ?? undefined}
      organizationData={userOrganizationData!}
    >
      <AppProvider
        selectedProjectUuid={selectedProject.uuid}
        selectedOrganizationUuid={selectedOrganization.uuid}
        userOrganizationData={userOrganizationData!}
      >
        <div className="flex h-screen">
          <DashboardSidebar userOrganizationData={userOrganizationData!} />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </AppProvider>
    </AuthProvider>
  );
}
