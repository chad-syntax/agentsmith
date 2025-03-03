import { GetUserOrganizationDataResult } from './onboarding';
import { createClient } from './supabase/server';

export const getOrganizationData = async (organizationUuid: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organizations')
    .select('*, projects(*)')
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
