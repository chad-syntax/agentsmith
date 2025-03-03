import { redirect } from 'next/navigation';
import { createClient } from '&/supabase/server';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { AuthProvider } from '@/app/providers/auth';
import {
  getUserOrganizationData,
  GetUserOrganizationDataResult,
  isUserOnboarded,
} from '&/onboarding';
import { getUser, GetUserResult } from '&/user';
import { AppProvider } from '@/app/providers/app';
import { routes } from '@/utils/routes';

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(routes.auth.signIn);
  }

  let redirectUrl: string | null = null;

  let agentsmithUser: GetUserResult | null = null;
  let userOrganizationData: GetUserOrganizationDataResult | null = null;
  let isOnboarded: boolean | null = null;

  try {
    agentsmithUser = await getUser(user.id);

    userOrganizationData = await getUserOrganizationData();

    isOnboarded = isUserOnboarded(userOrganizationData);
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
      organizationData={userOrganizationData!}
    >
      <AppProvider
        selectedProjectUuid={selectedProject.uuid}
        selectedOrganizationUuid={selectedOrganization.uuid}
        userOrganizationData={userOrganizationData!}
      >
        <div className="flex h-screen">
          <DashboardSidebar
            isOnboarded={isOnboarded!}
            userOrganizationData={userOrganizationData!}
          />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </AppProvider>
    </AuthProvider>
  );
}
