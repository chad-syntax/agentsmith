import { redirect } from 'next/navigation';
import { createClient } from '&/supabase/server';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { AuthProvider } from '@/app/providers/auth';
import { getUserOrganizationData, isUserOnboarded } from '&/onboarding';
import { getUser } from '&/user';
import { AppProvider } from '../providers/app';

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout(props: DashboardLayoutProps) {
  const { children } = props;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  try {
    const agentsmithUser = await getUser(user.id);

    const userOrganizationData = await getUserOrganizationData();

    const isOnboarded = isUserOnboarded(userOrganizationData);

    return (
      <AuthProvider
        user={user}
        agentsmithUser={agentsmithUser ?? undefined}
        organizationData={userOrganizationData}
      >
        <AppProvider userOrganizationData={userOrganizationData}>
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
    redirect('/error?message=Failed to fetch user data');
  }
}
