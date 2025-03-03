import { createClient } from '@/lib/supabase/server';

export const getProjectData = async (projectUuid: string) => {
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('uuid', projectUuid)
    .maybeSingle();

  if (error || !project) {
    console.error('Error fetching project:', error);
    return null;
  }

  return project;
};

export type GetProjectDataResult = Awaited<ReturnType<typeof getProjectData>>;
