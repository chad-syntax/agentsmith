import { redirect } from 'next/navigation';
import { createClient } from '&/supabase/server';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { AuthProvider } from '../providers/auth';

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

  const { data: agentsmithUser } = await supabase
    .from('agentsmith_users')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  return (
    <AuthProvider user={user} agentsmithUser={agentsmithUser ?? undefined}>
      <div className="flex h-screen">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </AuthProvider>
  );
}
