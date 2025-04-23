import { App } from 'octokit';
import {
  AgentsmithSupabaseService,
  AgentsmithSupabaseServiceConstructorOptions,
} from './AgentsmithSupabaseService';
import { base64Decode, base64Encode } from '@/utils/base64';
import { routes } from '@/utils/routes';

type VerifyInstallationOptions = {
  installationId: number;
  installationRecordUuid: string;
  organizationUuid: string;
};

type GetInstallationUrlOptions = {
  organizationUuid: string;
  installationRecordUuid: string;
};

type CreateInstallationRepositoriesOptions = {
  githubAppInstallationRecordId: number;
  organizationUuid: string;
  installationId: number;
};

type ConnectProjectRepositoryOptions = {
  projectId: number;
  projectUuid: string;
  projectRepositoryId: number;
  agentsmithFolder?: string;
};

export class GitHubAppService extends AgentsmithSupabaseService {
  public app: App;
  public githubAppName: string;

  constructor(options: AgentsmithSupabaseServiceConstructorOptions) {
    super({ ...options, serviceName: 'githubApp' });

    const appId = process.env.GITHUB_APP_ID!;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY!;
    const webhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET!;
    const githubAppName = process.env.GITHUB_APP_NAME!;

    if (!appId || !privateKey || !webhookSecret || !githubAppName) {
      throw new Error('GitHub app credentials not found');
    }

    this.githubAppName = githubAppName;

    this.app = new App({
      appId,
      privateKey: Buffer.from(privateKey, 'base64').toString('utf8'),
      webhooks: {
        secret: webhookSecret,
      },
    });
  }

  async createAppInstallationRecord(organizationUuid: string) {
    const organizationId = await this.services.organizations.getOrganizationId(organizationUuid);

    if (!organizationId) {
      throw new Error(`Organization not found: ${organizationUuid}`);
    }

    const { data, error } = await this.supabase
      .from('github_app_installations')
      .insert({
        organization_id: organizationId,
      })
      .select('uuid')
      .single();

    if (error) {
      throw new Error(`Failed to create installation record: ${error.message}`);
    }

    return data;
  }

  getInstallationUrl(options: GetInstallationUrlOptions) {
    const { organizationUuid, installationRecordUuid } = options;

    const state = base64Encode(JSON.stringify({ organizationUuid, installationRecordUuid }));

    const url = routes.github.createInstallation(this.githubAppName, state);

    return url;
  }

  decodeState(state: string) {
    const decodedState = base64Decode(state);
    const parsedState = JSON.parse(decodedState);

    return parsedState;
  }

  async verifyInstallation(options: VerifyInstallationOptions) {
    const { installationId, installationRecordUuid, organizationUuid } = options;

    try {
      await this.getInstallationRepositories(installationId);
    } catch (error: any) {
      // if we get a 404 error, means the installation does not exist
      console.error('Error fetching installation repositories:', error.status);

      if (error.status === 404) {
        return {
          isValid: false,
        };
      }

      throw error;
    }

    const { data, error } = await this.supabase
      .from('github_app_installations')
      .select('id, organizations(id, uuid)')
      .eq('uuid', installationRecordUuid)
      .single();

    if (error) {
      console.error('Error fetching installation:', error.message);
      throw new Error('Failed to verify installtion, organization not found for installation');
    }

    const isValidOrganization = data.organizations.uuid === organizationUuid;

    if (isValidOrganization) {
      const { error } = await this.supabase
        .from('github_app_installations')
        .update({
          status: 'ACTIVE',
          installation_id: installationId,
          organization_id: data.organizations.id,
        })
        .eq('uuid', installationRecordUuid);

      if (error) {
        throw new Error(`Failed to update installation status: ${error.message}`);
      }
    }

    return { isValid: isValidOrganization, githubAppInstallationRecordId: data.id };
  }

  async getActiveInstallation(organizationId: number) {
    const { data, error } = await this.supabase
      .from('github_app_installations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (error) {
      console.error(
        `Failed to fetch github app installation for organization ${organizationId}`,
        error,
      );
      throw error;
    }

    return data;
  }

  async connectProjectRepository(options: ConnectProjectRepositoryOptions) {
    const { projectId, projectUuid, projectRepositoryId, agentsmithFolder } = options;
    const { data, error } = await this.supabase
      .from('project_repositories')
      .update({
        project_id: projectId,
        agentsmith_folder: agentsmithFolder,
      })
      .eq('id', projectRepositoryId)
      .single();

    if (error) {
      console.error(
        `Failed to connect project ${projectId} to repository ${projectRepositoryId}`,
        error,
      );
      throw new Error('Failed to connect project to repository');
    }

    await this.services.githubSync.syncRepository(projectUuid);

    return data;
  }

  async getInstallationRepositories(installationId: number) {
    const octokit = await this.app.getInstallationOctokit(installationId);
    const response = await octokit.request('GET /installation/repositories');
    return response.data.repositories;
  }

  async getProjectRepositoriesForOrganization(organizationId: number) {
    const { data, error } = await this.supabase
      .from('project_repositories')
      .select(
        '*, github_app_installations!inner(status), organizations!inner(id), projects(uuid, name)',
      )
      .eq('github_app_installations.status', 'ACTIVE')
      .eq('organizations.id', organizationId);

    if (error) {
      console.error('Failed to fetch project repositories for organization', error);
      throw error;
    }

    return data;
  }

  async createInstallationRepositories(options: CreateInstallationRepositoriesOptions) {
    const { organizationUuid, installationId, githubAppInstallationRecordId } = options;

    const organizationId = await this.services.organizations.getOrganizationId(organizationUuid);

    if (!organizationId) {
      throw new Error('Organization not found, cannot create repository records');
    }

    const octokit = await this.app.getInstallationOctokit(installationId);
    const { data: installationRepos } = await octokit.request('GET /installation/repositories');

    const repositoriesToInsert = installationRepos.repositories.map((repo) => ({
      github_app_installation_id: githubAppInstallationRecordId,
      repository_id: repo.id,
      repository_name: repo.name,
      repository_full_name: repo.full_name,
      repository_default_branch: repo.default_branch,
      organization_id: organizationId,
    }));

    const { error } = await this.supabase.from('project_repositories').insert(repositoriesToInsert);

    if (error) {
      console.error('Failed to create project repositories', error);
      throw error;
    }
  }

  async getProjectRepository(projectId: number) {
    const { data, error } = await this.supabase
      .from('project_repositories')
      .select('*, github_app_installations(installation_id)')
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch project repository', error);
      throw error;
    }

    return data;
  }
}

export type GetInstallationRepositoriesResult = Awaited<
  ReturnType<typeof GitHubAppService.prototype.getInstallationRepositories>
>;

export type GetProjectRepositoriesForOrganizationResult = Awaited<
  ReturnType<typeof GitHubAppService.prototype.getProjectRepositoriesForOrganization>
>;

export type GetProjectRepositoryResult = Awaited<
  ReturnType<typeof GitHubAppService.prototype.getProjectRepository>
>;

export type CreateAppInstallationRecordResult = Awaited<
  ReturnType<typeof GitHubAppService.prototype.createAppInstallationRecord>
>;
