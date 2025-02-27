import { createClient } from '&/supabase/server';

export async function getOnboardingData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not found, cannot fetch onboarding state');
  }

  const { data, error } = await supabase
    .from('agentsmith_users')
    .select(
      'id, organization_users(id, organizations(id, projects(id))), user_keys(id, key)'
    )
    .eq('auth_user_id', user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export type GetOnboardingStateResult = Awaited<
  ReturnType<typeof getOnboardingData>
>;
