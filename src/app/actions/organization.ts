'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { routes } from '@/utils/routes';

import { createSuccessResponse, createErrorResponse } from '@/utils/action-helpers';

export const createOrganization = async (name: string) => {
  const supabase = await createClient();

  const { data: newOrganizationUuid, error } = await supabase.rpc('create_organization', {
    arg_name: name,
  });

  if (error) {
    return createErrorResponse(error.message);
  }

  if (!newOrganizationUuid) {
    return createErrorResponse('No new organization uuid returned, please try again');
  }

  return createSuccessResponse<string>(newOrganizationUuid, 'Organization created successfully.');
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
