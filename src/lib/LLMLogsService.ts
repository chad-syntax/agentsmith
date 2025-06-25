import { Database, Json } from '@/app/__generated__/supabase.types';
import {
  AgentsmithSupabaseService,
  AgentsmithSupabaseServiceConstructorOptions,
} from './AgentsmithSupabaseService';
import { AgentsmithServicesDirectory } from './AgentsmithServices';
import { OpenrouterRequestBody } from './openrouter';

type CreateLogEntryOptions = {
  projectId: number;
  promptVersionId: number;
  variables: Json;
  rawInput: OpenrouterRequestBody;
  source: Database['public']['Enums']['llm_log_source'];
};

export class LLMLogsService extends AgentsmithSupabaseService {
  public services!: AgentsmithServicesDirectory;

  constructor(options: AgentsmithSupabaseServiceConstructorOptions) {
    super({ ...options, serviceName: 'llmLogs' });
  }

  public async createLogEntry(options: CreateLogEntryOptions) {
    const { projectId, promptVersionId, variables, rawInput, source } = options;

    const { data, error } = await this.supabase
      .from('llm_logs')
      .insert({
        project_id: projectId,
        prompt_version_id: promptVersionId,
        prompt_variables: variables,
        raw_input: rawInput as Json,
        start_time: new Date().toISOString(),
        source,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(error, 'Error creating log entry:');
      return null;
    }

    return data;
  }

  public async updateLogWithCompletion(uuid: string, rawOutput: Json) {
    const { data, error } = await this.supabase
      .from('llm_logs')
      .update({
        raw_output: rawOutput,
        end_time: new Date().toISOString(),
      })
      .eq('uuid', uuid)
      .select()
      .single();

    if (error) {
      this.logger.error(error, 'Error updating log entry:');
      return null;
    }

    return data;
  }

  async getLogsByProjectId(projectId: number) {
    const { data, error } = await this.supabase
      .from('llm_logs')
      .select('*, projects(*), prompt_versions(*, prompts(*))')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(error, 'Error fetching logs:');
      return [];
    }

    return data;
  }

  public async getLogByUuid(uuid: string) {
    const { data, error } = await this.supabase
      .from('llm_logs')
      .select(
        `
        *,
        projects(*),
        prompt_versions(*, prompts(*))
      `,
      )
      .eq('uuid', uuid)
      .single();

    if (error) {
      this.logger.error(error, 'Error fetching log:');
      return null;
    }

    return data;
  }
}

export type GetLogsByProjectIdResult = Awaited<
  ReturnType<typeof LLMLogsService.prototype.getLogsByProjectId>
>;

export type GetLogByUuidResult = Awaited<ReturnType<typeof LLMLogsService.prototype.getLogByUuid>>;
