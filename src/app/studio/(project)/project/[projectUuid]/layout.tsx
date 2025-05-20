import { redirect } from 'next/navigation';
import { createClient } from '&/supabase/server';
import { DesktopStudioSidebar } from '@/components/studio-sidebar';
import { AuthProvider } from '@/providers/auth';
import { AppProvider } from '@/providers/app';
import { routes } from '@/utils/routes';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { GetUserOrganizationDataResult } from '@/lib/UsersService';
import { StudioHeader } from '@/components/studio-header';
import { cn } from '@/utils/shadcn';
import { STUDIO_FULL_HEIGHT } from '@/app/constants';

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
    <AuthProvider user={authUser} agentsmithUser={agentsmithUser ?? undefined}>
      <AppProvider
        selectedProjectUuid={selectedProject.uuid}
        selectedOrganizationUuid={selectedOrganization.uuid}
        userOrganizationData={userOrganizationData!}
      >
        <StudioHeader />
        <div className={cn('md:flex', STUDIO_FULL_HEIGHT)}>
          <DesktopStudioSidebar />
          <main className="pl-0 md:pl-12 flex-1 overflow-auto">{children}</main>
        </div>
      </AppProvider>
    </AuthProvider>
  );
}
