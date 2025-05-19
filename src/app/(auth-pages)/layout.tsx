import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { routes } from '@/utils/routes';
type AuthLayoutProps = {
  children: React.ReactNode;
};

export default async function AuthLayout(props: AuthLayoutProps) {
  const { children } = props;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(routes.studio.home);
  }

  return <>{children}</>;
}
