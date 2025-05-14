'use server';

import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';

type UpdateProjectGlobalsOptions = {
  projectUuid: string;
  globals: any;
};

export const updateProjectGlobals = async (options: UpdateProjectGlobalsOptions) => {
  const { projectUuid, globals } = options;

  const supabase = await createClient();

  const { services } = new AgentsmithServices({ supabase });

  try {
    await services.projects.updateProjectGlobals(projectUuid, globals);

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: 'Failed to update project globals',
    };
  }
};
