import { createClient } from '@/lib/supabase/server';
import { StudioPage } from '@/page-components/StudioPage';
import { routes } from '@/utils/routes';
import { redirect } from 'next/navigation';
import { AgentsmithServices } from '@/lib/AgentsmithServices';

export default async function WebStudioHome() {
  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  const { authUser } = await agentsmith.services.users.getAuthUser();

  if (!authUser) {
    redirect(routes.auth.signIn);
  }

  // get the user's organization data, and redirect to the project page if only one organization and only one project exists
  const userOrganizationData = await agentsmith.services.users.getUserOrganizationData();

  const onboardingChecklist = await agentsmith.services.users.getOnboardingChecklist();

  return (
    <StudioPage
      userOrganizationData={userOrganizationData}
      onboardingChecklist={onboardingChecklist}
    />
  );
}
