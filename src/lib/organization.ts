import { createClient } from './supabase/server';

export const getOrganizationData = async (organizationUuid: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organizations')
    .select('*, projects(*), organization_users(id, role, agentsmith_users(*))')
    .eq('uuid', organizationUuid)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export type GetOrganizationDataResult = Awaited<
  ReturnType<typeof getOrganizationData>
>;
