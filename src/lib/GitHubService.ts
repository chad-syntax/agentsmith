import { App } from 'octokit';
import {
  AgentsmithSupabaseService,
  AgentsmithSupabaseServiceConstructorOptions,
} from './AgentsmithSupabaseService';
import { EmitterWebhookEvent } from '@octokit/webhooks/dist-types/types';

type CreateInstallationOptions = {
  organizationUuid: string;
  installationId: number;
};

type SaveProjectRepositoryOptions = {
  projectId: number;
  organizationId: number;
  agentsmithFolder: string;
  repositoryId: number;
};

export class GitHubService extends AgentsmithSupabaseService {
  constructor(options: AgentsmithSupabaseServiceConstructorOptions) {
    super({ ...options, serviceName: 'github' });
  }

  async getInstallation(organizationId: number) {
    const { data, error } = await this.supabase
      .from('github_app_installations')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) {
      console.error(
        `Failed to fetch github app installation for organization ${organizationId}`,
        error
      );
      throw error;
    }

    return data;
  }

  async handleInstallationWebhook(
    payload: EmitterWebhookEvent<'installation'>['payload']
  ) {
    // const { data, error } = await this.supabase
    //   .from('github_app_installations')
    //   .insert({
    //     organization_id: payload.installation.account.id,
    //     installation_id: payload.installation.id,
    //   })
    //   .select('*')
    //   .single();
  }

  async createInstallation(options: CreateInstallationOptions) {
    const { organizationUuid, installationId } = options;

    const { data, error } = await this.supabase
      .from('organizations')
      .select('id')
      .eq('uuid', organizationUuid)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch organization', error);
      throw error;
    }

    if (!data) {
      console.error(
        'Organization not found, cannot create github installation record'
      );
      throw new Error(
        'Organization not found, cannot create github installation record'
      );
    }

    const { data: installation, error: installationError } = await this.supabase
      .from('github_app_installations')
      .insert({
        organization_id: data.id,
        installation_id: installationId,
      })
      .select('*')
      .single();

    if (installationError) {
      console.error(
        'Failed to create github installation record',
        installationError
      );
      throw installationError;
    }

    return installation;
  }

  async getInstallationRepositories(installationId: number) {
    const app = new App({
      appId: process.env.GITHUB_APP_ID as string,
      privateKey: Buffer.from(
        process.env.GITHUB_APP_PRIVATE_KEY || '',
        'base64'
      ).toString('utf8'),
      webhooks: {
        secret: process.env.GITHUB_APP_WEBHOOK_SECRET as string,
      },
    });

    const octokit = await app.getInstallationOctokit(installationId);
    const response = await octokit.request('GET /installation/repositories');
    return response.data.repositories;
  }

  async getProjectRepositoriesForOrganization(organizationId: number) {
    const { data, error } = await this.supabase
      .from('project_repositories')
      .select('*, projects!inner(organization_id, name)')
      .eq('projects.organization_id', organizationId);

    if (error) {
      console.error(
        'Failed to fetch project repositories for organization',
        error
      );
      throw error;
    }

    return data;
  }

  async saveProjectRepository(options: SaveProjectRepositoryOptions) {
    const { projectId, organizationId, agentsmithFolder, repositoryId } =
      options;

    const gitHubAppInstallation = await this.getInstallation(organizationId);

    if (!gitHubAppInstallation) {
      throw new Error('Organization does not have GitHub App Installed');
    }

    const repositories = await this.getInstallationRepositories(
      gitHubAppInstallation.installation_id
    );

    const repository = repositories.find((repo) => repo.id === repositoryId);

    if (!repository) {
      throw new Error(
        `Repository with ID ${repositoryId} not found in installation ${gitHubAppInstallation.installation_id}`
      );
    }

    const { data, error } = await this.supabase
      .from('project_repositories')
      .insert({
        organization_id: organizationId,
        project_id: projectId,
        repository_name: repository.name,
        repository_full_name: repository.full_name,
        agentsmith_folder: agentsmithFolder,
        github_app_installation_id: gitHubAppInstallation.id,
        repository_id: repositoryId,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Failed to save project repository', error);
      throw error;
    }

    return data;
  }
}

export type GetInstallationRepositoriesResult = Awaited<
  ReturnType<typeof GitHubService.prototype.getInstallationRepositories>
>;

export type GetProjectRepositoriesForOrganizationResult = Awaited<
  ReturnType<
    typeof GitHubService.prototype.getProjectRepositoriesForOrganization
  >
>;

export type SaveProjectRepositoryResult = Awaited<
  ReturnType<typeof GitHubService.prototype.saveProjectRepository>
>;
