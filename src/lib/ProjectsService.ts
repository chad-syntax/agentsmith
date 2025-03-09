import {
  AgentsmithSupabaseService,
  AgentsmithSupabaseServiceConstructorOptions,
} from './AgentsmithSupabaseService';

export class ProjectsService extends AgentsmithSupabaseService {
  constructor(options: AgentsmithSupabaseServiceConstructorOptions) {
    super({ ...options, serviceName: 'projects' });
  }

  async getProjectData(projectUuid: string) {
    const { data: project, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('uuid', projectUuid)
      .maybeSingle();

    if (error || !project) {
      console.error('Error fetching project:', error);
      return null;
    }

    return project;
  }
}

export type GetProjectDataResult = Awaited<
  ReturnType<typeof ProjectsService.prototype.getProjectData>
>;
