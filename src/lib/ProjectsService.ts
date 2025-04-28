import {
  AgentsmithSupabaseService,
  AgentsmithSupabaseServiceConstructorOptions,
} from './AgentsmithSupabaseService';

export class ProjectsService extends AgentsmithSupabaseService {
  constructor(options: AgentsmithSupabaseServiceConstructorOptions) {
    super({ ...options, serviceName: 'projects' });
  }

  async getProjectDataByUuid(projectUuid: string) {
    const { data: project, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('uuid', projectUuid)
      .maybeSingle();

    if (error || !project) {
      console.error('Error fetching project by uuid:', error);
      return null;
    }

    return project;
  }

  async getProjectDataById(projectId: number) {
    const { data: project, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (error || !project) {
      console.error('Error fetching project by id:', error);
      return null;
    }

    return project;
  }
}

export type GetProjectDataResult = Awaited<
  ReturnType<typeof ProjectsService.prototype.getProjectDataByUuid>
>;
