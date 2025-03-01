import { redirect } from 'next/navigation';
import { createClient } from '&/supabase/server';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { AuthProvider } from '@/app/providers/auth';
import { getUserOrganizationData, isUserOnboarded } from '&/onboarding';
import { getUser } from '&/user';
import { AppProvider, useApp } from '../../../providers/app';
import { routes } from '@/utils/routes';

type DashboardLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ projectUuid: string }>;
};

export default async function DashboardLayout(props: DashboardLayoutProps) {
  const { children, params } = props;

  const { projectUuid } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(routes.auth.signIn);
  }

  try {
    const agentsmithUser = await getUser(user.id);

    const userOrganizationData = await getUserOrganizationData();

    const isOnboarded = isUserOnboarded(userOrganizationData);

    const selectedProject = userOrganizationData.organization_users
      .flatMap((orgUser) => orgUser.organizations.projects)
      .find((project) => project.uuid === projectUuid);

    const selectedOrganization = userOrganizationData.organization_users
      .flatMap((orgUser) => orgUser.organizations)
      .find((org) =>
        org.projects.some((project) => project.uuid === projectUuid)
      );

    if (!selectedProject || !selectedOrganization) {
      redirect(routes.studio.home);
    }

    return (
      <AuthProvider
        user={user}
        agentsmithUser={agentsmithUser ?? undefined}
        organizationData={userOrganizationData}
      >
        <AppProvider
          selectedProjectUuid={selectedProject.uuid}
          selectedOrganizationUuid={selectedOrganization.uuid}
          userOrganizationData={userOrganizationData}
        >
          <div className="flex h-screen">
            <DashboardSidebar
              isOnboarded={isOnboarded}
              userOrganizationData={userOrganizationData}
            />
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
