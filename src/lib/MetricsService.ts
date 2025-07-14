import { Database } from '@/app/__generated__/supabase.types';
import {
  AgentsmithSupabaseService,
  AgentsmithSupabaseServiceConstructorOptions,
} from './AgentsmithSupabaseService';
import { AgentsmithServicesDirectory } from './AgentsmithServices';

export type GetMetricsDataOptions = {
  projectId: number;
  startDate: Date;
  endDate: Date;
  model?: string;
  provider?: string;
  promptId?: number;
  source?: Database['public']['Enums']['llm_log_source'];
  groupBy?: 'model' | 'provider' | 'prompt' | 'source';
};

export class MetricsService extends AgentsmithSupabaseService {
  public services!: AgentsmithServicesDirectory;

  constructor(options: AgentsmithSupabaseServiceConstructorOptions) {
    super({ ...options, serviceName: 'metrics' });
  }

  public async getMetricsData(options: GetMetricsDataOptions) {
    const {
      projectId,
      startDate,
      endDate,
      model: arg_model,
      provider: arg_provider,
      promptId: arg_prompt_id,
      source: arg_source,
      groupBy: arg_group_by,
    } = options;

    const { data, error } = await this.supabase.rpc('get_llm_log_metrics', {
      arg_project_id: projectId,
      arg_start_date: startDate.toISOString(),
      arg_end_date: endDate.toISOString(),
      arg_model,
      arg_provider,
      arg_prompt_id,
      arg_source,
      arg_group_by,
    } as any);

    if (error) {
      this.logger.error(error, 'Error fetching metrics data:');
      throw error;
    }

    return data || [];
  }

  public async getAvailableFilters(
    projectId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    models: string[];
    providers: string[];
    prompts: Array<{ id: number; name: string }>;
    sources: string[];
  }> {
    const { data, error } = await this.supabase.rpc('get_llm_log_filter_options', {
      arg_project_id: projectId,
      arg_start_date: startDate.toISOString(),
      arg_end_date: endDate.toISOString(),
    });

    if (error) {
      this.logger.error(error, 'Error fetching available filters:');
      return { models: [], providers: [], prompts: [], sources: [] };
    }

    // The SQL function returns arrays directly, so extract them
    const result = data?.[0];
    if (!result) {
      return { models: [], providers: [], prompts: [], sources: [] };
    }

    return {
      models: result.models || [],
      providers: result.providers || [],
      prompts: (result.prompts as Array<{ id: number; name: string }>) || [],
      sources: result.sources || [],
    };
  }
}

export type GetMetricsDataResult = Awaited<
  ReturnType<typeof MetricsService.prototype.getMetricsData>
>;
export type GetAvailableFiltersResult = Awaited<
  ReturnType<typeof MetricsService.prototype.getAvailableFilters>
>;
