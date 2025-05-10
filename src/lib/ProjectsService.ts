import { Database } from '@/app/__generated__/supabase.types';
import {
  AgentsmithSupabaseService,
  AgentsmithSupabaseServiceConstructorOptions,
} from './AgentsmithSupabaseService';

type GetProjectRepositoryByInstallationIdOptions = {
  repositoryId: number;
  installationId: number;
};

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

    if (error) {
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

    if (error) {
      console.error('Error fetching project by id:', error);
      return null;
    }

    return project;
  }

  async getProjectRepositoryByInstallationId(options: GetProjectRepositoryByInstallationIdOptions) {
    const { repositoryId, installationId } = options;

    const { data: projectRepo, error: repoError } = await this.supabase
      .from('project_repositories')
      .select('*, projects(name), github_app_installations!inner(installation_id)')
      .eq('repository_id', repositoryId)
      .eq('github_app_installations.installation_id', installationId)
      .maybeSingle();

    if (repoError) {
      console.error('Error fetching project repository for push event:', repoError);
      return null;
    }

    return projectRepo;
  }

  async getProjectRepositoryByProjectId(projectId: number) {
    const { data: projectRepo, error: repoError } = await this.supabase
      .from('project_repositories')
      .select('*, projects(name), github_app_installations(installation_id)')
      .eq('project_id', projectId)
      .maybeSingle();

    if (repoError) {
      console.error('Error fetching project repository for project id:', repoError);
      return null;
    }

    return projectRepo;
  }

  async lockProjectRepository(projectRepositoryId: number) {
    const { error: lockError } = await this.supabase
      .from('project_repositories')
      .update({ sync_status: 'SYNCING', sync_started_at: new Date().toISOString() })
      .eq('id', projectRepositoryId);

    if (lockError) {
      console.error('Error locking project repository:', lockError);
      throw new Error('Error locking project repository');
    }
  }

  async unlockProjectRepository(projectRepositoryId: number) {
    const { error: unlockError } = await this.supabase
      .from('project_repositories')
      .update({ sync_status: 'IDLE', sync_started_at: null })
      .eq('id', projectRepositoryId);

    if (unlockError) {
      console.error('Error unlocking project repository:', unlockError);
      throw new Error('Error unlocking project repository');
    }
  }
}

export type GetProjectDataResult = Awaited<
  ReturnType<typeof ProjectsService.prototype.getProjectDataByUuid>
>;

export type GetProjectRepositoryByInstallationIdResult = Awaited<
  ReturnType<typeof ProjectsService.prototype.getProjectRepositoryByInstallationId>
>;

export type GetProjectRepositoryByProjectIdResult = Awaited<
  ReturnType<typeof ProjectsService.prototype.getProjectRepositoryByProjectId>
>;
