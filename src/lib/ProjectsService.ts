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
      .select(
        '*, organizations(uuid), global_contexts(content), prompts(uuid, name), project_repositories(agentsmith_folder, repository_default_branch, repository_full_name), agentsmith_events(type, created_at)',
      )
      .eq('uuid', projectUuid)
      .limit(1, { referencedTable: 'agentsmith_events' })
      .order('created_at', { referencedTable: 'agentsmith_events', ascending: false })
      .maybeSingle();

    if (error) {
      this.logger.error('Error fetching project by uuid:', error);
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
      this.logger.error('Error fetching project by id:', error);
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
      this.logger.error('Error fetching project repository for push event:', repoError);
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
      this.logger.error('Error fetching project repository for project id:', repoError);
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
      this.logger.error('Error locking project repository:', lockError);
      throw new Error('Error locking project repository');
    }
  }

  async unlockProjectRepository(projectRepositoryId: number) {
    const { error: unlockError } = await this.supabase
      .from('project_repositories')
      .update({ sync_status: 'IDLE', sync_started_at: null })
      .eq('id', projectRepositoryId);

    if (unlockError) {
      this.logger.error('Error unlocking project repository:', unlockError);
      throw new Error('Error unlocking project repository');
    }
  }

  async getProjectGlobalsByUuid(projectUuid: string) {
    const { data: globals, error } = await this.supabase
      .from('global_contexts')
      .select('*, projects!inner(uuid)')
      .eq('projects.uuid', projectUuid)
      .maybeSingle();

    if (error) {
      this.logger.error('Error fetching project globals:', error);
      return null;
    }

    return globals;
  }

  async getProjectGlobalsByProjectId(projectId: number) {
    const { data: globals, error } = await this.supabase
      .from('global_contexts')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) {
      this.logger.error('Error fetching project globals:', error);
      return null;
    }

    return globals;
  }

  async updateProjectGlobals(projectUuid: string, globals: any) {
    const { data: project, error: projectError } = await this.supabase
      .from('projects')
      .select('id')
      .eq('uuid', projectUuid)
      .maybeSingle();

    if (projectError) {
      this.logger.error('Failed to get project for globals update:', projectError);
      throw new Error('Failed to get project for globals update');
    }

    if (!project) {
      this.logger.error('Project not found for globals update');
      throw new Error('Project not found for globals update');
    }

    const { error } = await this.supabase
      .from('global_contexts')
      .update({
        content: globals,
        last_sync_git_sha: null,
      })
      .eq('project_id', project.id);

    if (error) {
      this.logger.error('Error updating project globals:', error);
      throw new Error('Error updating project globals');
    }
  }

  async updateProjectGlobalsSha(projectId: number, sha: string) {
    const { error } = await this.supabase
      .from('global_contexts')
      .update({ last_sync_git_sha: sha })
      .eq('project_id', projectId);

    if (error) {
      this.logger.error('Error updating project globals sha:', error);
      throw new Error('Error updating project globals sha');
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

export type GetProjectGlobalsResult = Awaited<
  ReturnType<typeof ProjectsService.prototype.getProjectGlobalsByUuid>
>;

export type GetProjectGlobalsByProjectIdResult = Awaited<
  ReturnType<typeof ProjectsService.prototype.getProjectGlobalsByProjectId>
>;
