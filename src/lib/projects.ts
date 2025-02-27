import { createClient } from '~/lib/supabase/server';
import { Database } from '@/app/__generated__/supabase.types';

/**
 * Gets the first project for the current user
 * @returns The first project or null if none exists
 */
export const getFirstProject = async (): Promise<
  Database['public']['Tables']['projects']['Row'] | null
> => {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .limit(1)
    .order('created_at', { ascending: false });

  if (error || !projects || projects.length === 0) {
    console.error('Error fetching first project:', error);
    return null;
  }

  return projects[0];
};
