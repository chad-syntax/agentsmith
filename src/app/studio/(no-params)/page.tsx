import { getUserOrganizationData } from '@/lib/onboarding';
import { createClient } from '@/lib/supabase/server';
import { StudioPage } from '@/page-components/StudioPage';
import { routes } from '@/utils/routes';
import { redirect } from 'next/navigation';

export default async function WebStudioHome() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(routes.auth.signIn);
  }

  // get the user's organization data, and redirect to the project page if only one organization and only one project exists
  const userOrganizationData = await getUserOrganizationData();

  return <StudioPage userOrganizationData={userOrganizationData} />;
}
