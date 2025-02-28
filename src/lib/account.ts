import { createClient } from './supabase/server';
import { getUser } from './user';

export const getAccountData = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const agentsmithUser = await getUser(user.id);
  if (!agentsmithUser) {
    return null;
  }

  const { data, error } = await supabase
    .from('agentsmith_users')
    .select(
      `
      organization_users (
        organizations (
          id,
          name,
          organization_keys (
            key
          )
        )
      )
    `
    )
    .eq('id', agentsmithUser.id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
};

// Export the inferred type from the query
export type AccountData = NonNullable<
  Awaited<ReturnType<typeof getAccountData>>
>;
