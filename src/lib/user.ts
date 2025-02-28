import { createClient } from './supabase/server';

export const getUser = async (authUserId: string) => {
  const supabase = await createClient();

  const { data: agentsmithUser } = await supabase
    .from('agentsmith_users')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  return agentsmithUser;
};

export type GetUserResult = Awaited<ReturnType<typeof getUser>>;
