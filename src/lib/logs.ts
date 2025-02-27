import { createClient } from '&/supabase/server';
import type { Database } from '@/app/__generated__/supabase.types';

/**
 * Get the first project from the database
 * This is a temporary function until we implement proper project selection
 */
export async function getFirstProject() {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching first project:', error);
    return null;
  }

  return projects.length > 0 ? projects[0] : null;
}

/**
 * Get logs for a specific project
 */
export async function getLogsByProjectId(projectId: number) {
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from('llm_logs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching logs:', error);
    return [];
  }

  return logs;
}

/**
 * Get a specific log by its ID
 */
export async function getLogById(logId: number) {
  const supabase = await createClient();

  const { data: log, error } = await supabase
    .from('llm_logs')
    .select('*')
    .eq('id', logId)
    .single();

  if (error) {
    console.error('Error fetching log:', error);
    return null;
  }

  return log;
}

/**
 * Get a specific log by its UUID
 */
export async function getLogByUuid(uuid: string) {
  const supabase = await createClient();

  const { data: log, error } = await supabase
    .from('llm_logs')
    .select(
      `
      *,
      projects(*),
      prompt_versions(*)
    `
    )
    .eq('uuid', uuid)
    .single();

  if (error) {
    console.error('Error fetching log by UUID:', error);
    return null;
  }

  return log;
}
