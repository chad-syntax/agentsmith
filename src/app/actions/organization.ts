'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const createOrganization = async (name: string) => {
  const supabase = await createClient();

  const { data: newOrganizationUuid, error } = await supabase.rpc(
    'create_organization',
    {
      arg_name: name,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!newOrganizationUuid) {
    throw new Error('No new organization uuid returned, please try again');
  }

  const redirectUrl = `/studio/organization/${newOrganizationUuid}`;

  return redirect(redirectUrl);
};

export const renameOrganization = async (
  organizationUuid: string,
  name: string
) => {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('rename_organization', {
    arg_organization_uuid: organizationUuid,
    arg_name: name,
  });

  if (error) {
    throw new Error(error.message);
  }

  const redirectUrl = `/studio/organization/${organizationUuid}`;

  return redirect(redirectUrl);
};
