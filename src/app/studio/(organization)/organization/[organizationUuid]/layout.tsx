import { redirect } from 'next/navigation';
import { createClient } from '&/supabase/server';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { AuthProvider } from '@/app/providers/auth';
import { getUserOrganizationData, isUserOnboarded } from '&/onboarding';
import { getUser } from '&/user';
import { AppProvider } from '@/app/providers/app';
import { routes } from '@/utils/routes';
import { getOrganizationData } from '@/lib/organization';

type DashboardLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    organizationUuid: string;
  }>;
};

export default async function DashboardLayout(props: DashboardLayoutProps) {
  const { children, params } = props;

  const { organizationUuid } = await params;

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect(routes.auth.signIn);
    }

    const agentsmithUser = await getUser(user.id);

    const userOrganizationData = await getUserOrganizationData();

    const organization = await getOrganizationData(organizationUuid);

    const firstOrganizationProject = organization.projects[0];

    return (
      <AuthProvider
        user={user}
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
