import { createClient } from '&/supabase/server';

// TODO:
// so if we are going to be connecting openrouter to the organization and not the project or the user, then we need to adjust the `user_keys`
// table because we would no longer need it, we instead need like an `organization_keys` table.

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
