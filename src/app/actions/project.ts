'use server';

import { createClient } from '@/lib/supabase/server';
import { createErrorResponse, createSuccessResponse } from '@/utils/action-helpers';
import { AgentsmithServices } from '@/lib/AgentsmithServices';

export const createProject = async (organizationUuid: string, projectName: string) => {
  const supabase = await createClient();

  const { services, logger } = new AgentsmithServices({ supabase });
  const { agentsmithUser } = await services.users.initialize();

  if (!agentsmithUser) {
    return createErrorResponse('User not found, could not create project.');
  }

  const { data: organization, error: organizationIdError } = await supabase
    .from('organizations')
    .select('id')
    .eq('uuid', organizationUuid)
    .single();

  if (organizationIdError) {
    logger.error(organizationIdError, 'Error fetching organization for');
    return createErrorResponse(organizationIdError.message);
  }

  const { data: isUnderProjectLimit, error: isUnderProjectLimitError } = await supabase.rpc(
    'is_under_project_limit',
    {
      arg_organization_id: organization.id,
    },
  );

  if (isUnderProjectLimitError) {
    logger.error(isUnderProjectLimitError, 'Error checking if organization is under project limit');
    return createErrorResponse(isUnderProjectLimitError.message);
  }

  if (!isUnderProjectLimit) {
    return createErrorResponse('Organization is over project limit, cannot create project.');
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: projectName,
      organization_id: organization.id,
      created_by: agentsmithUser.id,
    })
    .select('uuid')
    .single();

  if (error) {
    logger.error(error, 'Error creating project');
    return createErrorResponse(error.message);
  }

  return createSuccessResponse<string>(data.uuid, 'Project created successfully.');
};
