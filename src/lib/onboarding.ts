import { ORGANIZATION_KEYS } from '@/app/constants';
import { createClient } from '@/lib/supabase/server';

export async function getUserOrganizationData() {
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
      ` 
      organization_users (
        id, 
        organizations (
          uuid,
          name, 
          organization_keys (
            id,
            key
          ),
          projects (
            uuid,
            name
          )
        )
      )`
    )
    .eq('auth_user_id', user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export type GetUserOrganizationDataResult = Awaited<
  ReturnType<typeof getUserOrganizationData>
>;

export const isUserOnboarded = (
  organizationData: GetUserOrganizationDataResult
) => {
  return organizationData.organization_users?.some((orgUser) => {
    const orgKeys = orgUser.organizations?.organization_keys;
    return (
      Array.isArray(orgKeys) &&
      orgKeys.some((key) => key.key === ORGANIZATION_KEYS.OPENROUTER_API_KEY)
    );
  });
};
