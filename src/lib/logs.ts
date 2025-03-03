import { createClient } from '@/lib/supabase/server';

/**
 * Fetch logs for a specific project
 */
export const getLogsByProjectId = async (projectId: number) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('llm_logs')
    .select(
      `
      *,
      projects(*),
      prompt_versions(*)
    `
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching logs:', error);
    return [];
  }

  return data;
};

/**
 * Fetch a specific log by UUID with related data
 */
export const getLogByUuid = async (uuid: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
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
    console.error('Error fetching log:', error);
    return null;
  }

  return data;
};

/**
 * Insert a new log entry for a prompt run
 */
export const createLogEntry = async (
  projectId: number,
  promptVersionId: number,
  promptVariables: Record<string, any>,
  rawInput: Record<string, any>
) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('llm_logs')
    .insert({
      project_id: projectId,
      prompt_version_id: promptVersionId,
      prompt_variables: promptVariables,
      raw_input: rawInput,
      start_time: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating log entry:', error);
    return null;
  }

  return data;
};

/**
 * Update a log entry with completion data
 */
export const updateLogWithCompletion = async (
  uuid: string,
  rawOutput: Record<string, any>
) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('llm_logs')
    .update({
      raw_output: rawOutput,
      end_time: new Date().toISOString(),
    })
    .eq('uuid', uuid)
    .select()
    .single();

  if (error) {
    console.error('Error updating log entry:', error);
    return null;
  }

  return data;
};
