import { redirect } from 'next/navigation';
import { createClient } from '&/supabase/server';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { AuthProvider } from '../providers/auth';
import { getOnboardingData } from '&/onboarding';
import { getUser } from '&/user';

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

  const agentsmithUser = await getUser(user.id);

  const onboardingData = await getOnboardingData();

  const hasOnboarded = onboardingData.user_keys.some(
    (userKey) => userKey.key === 'OPENROUTER_API_KEY'
  );

  return (
    <AuthProvider user={user} agentsmithUser={agentsmithUser ?? undefined}>
      <div className="flex h-screen">
        <DashboardSidebar hasOnboarded={hasOnboarded} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </AuthProvider>
  );
}
