'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { routes } from '@/utils/routes';

import { createSuccessResponse, createErrorResponse } from '@/utils/action-helpers';
import { ActionResponse } from '@/types/action-response';

type NewOrganizationData = {
  organization_uuid: string;
  project_uuid: string;
};

export const createOrganization = async (
  name: string,
): Promise<ActionResponse<NewOrganizationData>> => {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('create_organization_v2', {
    arg_name: name,
  });

  if (error) {
    return createErrorResponse(error.message);
  }

  if (!data) {
    return createErrorResponse('No new organization data returned, please try again');
  }

  const newOrganizationData = data as NewOrganizationData;

  return createSuccessResponse<NewOrganizationData>(
    newOrganizationData,
    'Organization created successfully.',
  );
};

export const renameOrganization = async (organizationUuid: string, name: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('rename_organization', {
    arg_organization_uuid: organizationUuid,
    arg_name: name,
  });

  if (error) {
    return createErrorResponse(error.message, {
      'rename-organization': [error.message],
    });
  }

  const redirectUrl = routes.studio.organization(organizationUuid);

  return redirect(redirectUrl);
};

export const joinOrganization = async (inviteCode: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('join_organization', {
    arg_invite_code: inviteCode,
  });

  if (error) {
    return createErrorResponse(error.message, {
      'join-organization': [error.message],
    });
  }

  return createSuccessResponse<string>(data, 'Organization joined successfully.');
};

export const removeOrganizationUser = async (
  organizationUserId: number,
  organizationUuid: string,
) => {
  const supabase = await createClient();

  const { error } = await supabase.from('organization_users').delete().eq('id', organizationUserId);

  if (error) {
    return createErrorResponse(error.message);
  }

  const revalidateUrl = routes.studio.organization(organizationUuid);
  redirect(revalidateUrl);

  return createSuccessResponse(null, 'User removed successfully.');
};
