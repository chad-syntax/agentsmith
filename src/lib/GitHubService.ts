import { App } from 'octokit';
import {
  AgentsmithSupabaseService,
  AgentsmithSupabaseServiceConstructorOptions,
} from './AgentsmithSupabaseService';
import { EmitterWebhookEvent } from '@octokit/webhooks/dist-types/types';
import { Octokit } from '@octokit/core';
import { Api } from '@octokit/plugin-rest-endpoint-methods/dist-types/types';
import { GetProjectDataResult } from './ProjectsService';
import { base64Decode, base64Encode } from '@/utils/base64';

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

type SaveGithubProviderTokensOptions = {
  supabaseUserId: string;
  sessionId: string;
  providerToken: string;
  providerRefreshToken: string;
};

type ConnectProjectRepositoryOptions = {
  projectId: number;
  projectRepositoryId: number;
  agentsmithFolder?: string;
};

export class GitHubService extends AgentsmithSupabaseService {
  public app: App;
  private githubAppName: string;

  constructor(options: AgentsmithSupabaseServiceConstructorOptions) {
    super({ ...options, serviceName: 'github' });

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

    this.app.webhooks.on('installation.suspend', async ({ payload }) => {
      await this.handleInstallationSuspended(payload);
    });

    this.app.webhooks.on('installation.unsuspend', async ({ payload }) => {
      await this.handleInstallationUnsuspended(payload);
    });

    this.app.webhooks.on('installation.deleted', async ({ payload }) => {
      await this.handleInstallationDeleted(payload);
    });

    this.app.webhooks.on('installation_repositories.added', async ({ payload }) => {
      await this.handleInstallationRepositoriesAdded(payload);
    });

    this.app.webhooks.on('installation_repositories.removed', async ({ payload }) => {
      await this.handleInstallationRepositoriesRemoved(payload);
    });

    this.app.webhooks.on('pull_request.opened', async ({ payload }) => {
      try {
        // Do something
        console.log('github webhook: pull request opened', payload);
      } catch (e) {
        console.error(`pull_request.opened handler failed with error: ${(<Error>e).message}`);
      }
    });

    this.app.webhooks.on('pull_request.edited', async ({ payload }) => {
      try {
        // Do something else
        console.log('github webhook: pull request edited', payload);
      } catch (e) {
        console.error(`pull_request.edited handler failed with error: ${(<Error>e).message}`);
      }
    });

    this.app.webhooks.on('push', async ({ payload }) => {
      try {
        // Do something else
        console.log('github webhook: push', payload);
      } catch (e) {
        console.error(`push handler failed with error: ${(<Error>e).message}`);
      }
    });
  }

  async saveGithubProviderTokens(options: SaveGithubProviderTokensOptions) {
    const { supabaseUserId, providerToken, providerRefreshToken } = options;

    // TODO
    // save these tokens to the vault, link those vault ids to their agentsmith_user records
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

    const url = `https://github.com/apps/${this.githubAppName}/installations/new?state=${state}`;

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
    const { projectId, projectRepositoryId, agentsmithFolder } = options;
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

    return data;
  }

  private async handleInstallationDeleted(
    payload: EmitterWebhookEvent<'installation.deleted'>['payload'],
  ) {
    try {
      const { error } = await this.supabase
        .from('github_app_installations')
        .update({ status: 'DELETED' })
        .eq('installation_id', payload.installation.id);

      if (error) {
        console.error('Failed to update installation status to DELETED:', error);
        throw error;
      }
    } catch (e) {
      console.error(`installation.deleted handler failed with error: ${(<Error>e).message}`);
    }
  }

  private async handleInstallationSuspended(
    payload: EmitterWebhookEvent<'installation.suspend'>['payload'],
  ) {
    try {
      const { error } = await this.supabase
        .from('github_app_installations')
        .update({ status: 'SUSPENDED' })
        .eq('installation_id', payload.installation.id);

      if (error) {
        console.error('Failed to update installation status to SUSPENDED:', error);
      }
    } catch (e) {
      console.error(`installation.suspended handler failed with error: ${(<Error>e).message}`);
    }
  }

  private async handleInstallationUnsuspended(
    payload: EmitterWebhookEvent<'installation.unsuspend'>['payload'],
  ) {
    try {
      const { error } = await this.supabase
        .from('github_app_installations')
        .update({ status: 'ACTIVE' })
        .eq('installation_id', payload.installation.id);

      if (error) {
        console.error('Failed to update installation status to ACTIVE:', error);
        throw error;
      }
    } catch (e) {
      console.error(`installation.unsuspend handler failed with error: ${(<Error>e).message}`);
    }
  }

  private async handleInstallationRepositoriesAdded(
    payload: EmitterWebhookEvent<'installation_repositories.added'>['payload'],
  ) {
    try {
      const { repositories_added, installation } = payload;
      if (!repositories_added?.length) return;

      const { data: installationRecord } = await this.supabase
        .from('github_app_installations')
        .select('id, organizations(id)')
        .eq('installation_id', installation.id)
        .single();

      if (!installationRecord) {
        throw new Error(`No installation record found for installation ID ${installation.id}`);
      }

      const { error } = await this.supabase.from('project_repositories').insert(
        repositories_added.map((repo) => ({
          github_app_installation_id: installationRecord.id,
          organization_id: installationRecord.organizations.id,
          repository_id: repo.id,
          repository_name: repo.name,
          repository_full_name: repo.full_name,
        })),
      );

      if (error) {
        console.error('Failed to insert repository records:', error);
        throw error;
      }
    } catch (e) {
      console.error(
        `installation_repositories.added handler failed with error: ${(<Error>e).message}`,
      );
    }
  }

  private async handleInstallationRepositoriesRemoved(
    payload: EmitterWebhookEvent<'installation_repositories.removed'>['payload'],
  ) {
    try {
      const { repositories_removed } = payload;
      if (!repositories_removed?.length) return;

      const { error } = await this.supabase
        .from('project_repositories')
        .delete()
        .in(
          'repository_id',
          repositories_removed.map((repo) => repo.id),
        );

      if (error) {
        console.error('Failed to delete repository records:', error);
        throw error;
      }
    } catch (e) {
      console.error(
        `installation_repositories.removed handler failed with error: ${(<Error>e).message}`,
      );
    }
  }

  async getInstallationRepositories(installationId: number) {
    const octokit = await this.app.getInstallationOctokit(installationId);
    const response = await octokit.request('GET /installation/repositories');
    return response.data.repositories;
  }

  async getProjectRepositoriesForOrganization(organizationId: number) {
    const { data, error } = await this.supabase
      .from('project_repositories')
      .select('*, organizations!inner(id), projects(uuid, name)')
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

    const repositories = await this.getInstallationRepositories(installationId);

    const { error } = await this.supabase.from('project_repositories').insert(
      repositories.map((repo) => ({
        github_app_installation_id: githubAppInstallationRecordId,
        repository_id: repo.id,
        repository_name: repo.name,
        repository_full_name: repo.full_name,
        organization_id: organizationId,
      })),
    );

    if (error) {
      console.error('Failed to create project repositories', error);
      throw error;
    }
  }

  async getProjectRepository(projectId: number) {
    const { data, error } = await this.supabase
      .from('project_repositories')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch project repository', error);
      throw error;
    }

    return data;
  }

  // gets triggered by "sync" button press
  async syncRepository(projectUuid: string) {
    // fetch the project that is connected to the project repository
    const project = await this.services.projects.getProjectData(projectUuid);

    if (!project) {
      throw new Error('Project not found');
    }

    const projectRepository = await this.getProjectRepository(project.id);

    if (!projectRepository) {
      throw new Error('Project is not connected to a GitHub repository');
    }

    const octokit = await this.app.getInstallationOctokit(
      projectRepository.github_app_installation_id,
    );

    const [owner, repo] = projectRepository.repository_full_name.split('/');

    // check repository for any pending pull requests that are agentsmith pull requests
    const pullRequests = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
      owner,
      repo,
      state: 'open',
      labels: 'agentsmith',
    });

    if (pullRequests.data.length > 0) {
      const pullRequest = pullRequests.data[0];
      await this.syncPRFiles(
        octokit,
        owner,
        repo,
        project,
        projectRepository,
        pullRequest.head.ref,
      );
    } else {
      // Create a new PR
      // 1. Get default branch
      const { data: repository } = await octokit.request('GET /repos/{owner}/{repo}', {
        owner,
        repo,
      });

      const defaultBranch = repository.default_branch;

      // 2. Get the latest commit SHA from the default branch
      const { data: ref } = await octokit.request(
        'GET /repos/{owner}/{repo}/git/ref/heads/{branch}',
        {
          owner,
          repo,
          branch: defaultBranch,
        },
      );

      const sha = ref.object.sha;

      // 3. Create a new branch from the default branch
      const branchName = `agentsmith-sync-${new Date().getTime()}`;
      await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha,
      });

      // 4. Sync files to the new branch
      await this.syncPRFiles(octokit, owner, repo, project, projectRepository, branchName);

      // 5. Create a new PR
      const { data: newPR } = await octokit.request('POST /repos/{owner}/{repo}/pulls', {
        owner,
        repo,
        title: 'Agentsmith Sync',
        body: 'Syncing prompts and variables from Agentsmith',
        head: branchName,
        base: defaultBranch,
      });

      // 6. Add the agentsmith label to the PR
      // First get or create the label if it doesn't exist
      try {
        await octokit.request('GET /repos/{owner}/{repo}/labels/agentsmith', {
          owner,
          repo,
        });
      } catch (error) {
        // Label doesn't exist, create it
        await octokit.request('POST /repos/{owner}/{repo}/labels', {
          owner,
          repo,
          name: 'agentsmith',
          color: '0E8A16', // Green color
          description: 'PRs created by Agentsmith',
        });
      }

      // Then add the label to the PR
      await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/labels', {
        owner,
        repo,
        issue_number: newPR.number,
        labels: ['agentsmith'],
      });
    }
  }

  // Helper method to sync files to a branch with or without an existing PR
  private async syncPRFiles(
    octokit: Octokit & Api,
    owner: string,
    repo: string,
    project: NonNullable<GetProjectDataResult>,
    projectRepository: NonNullable<GetProjectRepositoryResult>,
    branchName: string,
  ) {
    const promptsData = await this.services.prompts.getAllPromptsData(project.id);

    // Check if all prompts and prompt versions exist in the repository
    const missingFiles: FileToSync[] = [];
    const updateNeededFiles: FileToSync[] = [];

    // Retrieve the current state of the agentsmith folder
    let repoFiles;
    try {
      const response = await octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
        owner,
        repo,
        tree_sha: branchName,
        recursive: '1',
      });
      repoFiles = response.data.tree;
    } catch (error) {
      console.error('Failed to fetch repository file structure', error);
      throw error;
    }

    // Create a map of existing files for easier lookup
    const fileMap = new Map();
    repoFiles.forEach((file) => {
      if (file.path) {
        fileMap.set(file.path, file);
      }
    });

    // Check each prompt and its versions
    for (const prompt of promptsData) {
      const promptPath = `${projectRepository.agentsmith_folder}/prompts/${prompt.slug}`;
      const promptJsonPath = `${promptPath}/prompt.json`;

      // Check if prompt.json exists
      if (!fileMap.has(promptJsonPath)) {
        missingFiles.push({
          path: promptJsonPath,
          content: JSON.stringify(prompt, null, 2),
        });
      } else {
        // Check if prompt.json needs update by comparing content
        try {
          const fileContent = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
            owner,
            repo,
            path: promptJsonPath,
            ref: branchName,
          });

          // Check if response is a file and has content
          if (
            !Array.isArray(fileContent.data) &&
            fileContent.data.type === 'file' &&
            fileContent.data.content
          ) {
            const existingContent = Buffer.from(fileContent.data.content, 'base64').toString();
            const currentContent = JSON.stringify(prompt, null, 2);

            if (existingContent !== currentContent) {
              updateNeededFiles.push({
                path: promptJsonPath,
                content: currentContent,
              });
            }
          }
        } catch (error) {
          console.error(`Failed to fetch content for ${promptJsonPath}`, error);
        }
      }

      // Check each prompt version
      for (const version of prompt.prompt_versions || []) {
        const versionPath = `${promptPath}/${version.version}`;
        const versionJsonPath = `${versionPath}/version.json`;
        const variablesJsonPath = `${versionPath}/variables.json`;

        // Check if version.json exists
        if (!fileMap.has(versionJsonPath)) {
          missingFiles.push({
            path: versionJsonPath,
            content: JSON.stringify(version, null, 2),
          });
        } else {
          // Check if version.json needs update
          try {
            const fileContent = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
              owner,
              repo,
              path: versionJsonPath,
              ref: branchName,
            });

            // Check if response is a file and has content
            if (
              !Array.isArray(fileContent.data) &&
              fileContent.data.type === 'file' &&
              fileContent.data.content
            ) {
              const existingContent = Buffer.from(fileContent.data.content, 'base64').toString();
              const currentContent = JSON.stringify(version, null, 2);

              if (existingContent !== currentContent) {
                updateNeededFiles.push({
                  path: versionJsonPath,
                  content: currentContent,
                });
              }
            }
          } catch (error) {
            console.error(`Failed to fetch content for ${versionJsonPath}`, error);
          }
        }

        // Check if variables.json exists
        if (version.prompt_variables && version.prompt_variables.length > 0) {
          if (!fileMap.has(variablesJsonPath)) {
            missingFiles.push({
              path: variablesJsonPath,
              content: JSON.stringify(version.prompt_variables, null, 2),
            });
          } else {
            // Check if variables.json needs update
            try {
              const fileContent = await octokit.request(
                'GET /repos/{owner}/{repo}/contents/{path}',
                {
                  owner,
                  repo,
                  path: variablesJsonPath,
                  ref: branchName,
                },
              );

              // Check if response is a file and has content
              if (
                !Array.isArray(fileContent.data) &&
                fileContent.data.type === 'file' &&
                fileContent.data.content
              ) {
                const existingContent = Buffer.from(fileContent.data.content, 'base64').toString();
                const currentContent = JSON.stringify(version.prompt_variables, null, 2);

                if (existingContent !== currentContent) {
                  updateNeededFiles.push({
                    path: variablesJsonPath,
                    content: currentContent,
                  });
                }
              }
            } catch (error) {
              console.error(`Failed to fetch content for ${variablesJsonPath}`, error);
            }
          }
        }
      }
    }

    // If there are missing or outdated files, update the pull request
    if (missingFiles.length > 0 || updateNeededFiles.length > 0) {
      console.log(
        `Found ${missingFiles.length} missing files and ${updateNeededFiles.length} files needing updates`,
      );

      // Update or create files in the pull request
      // First handle missing files
      for (const file of missingFiles) {
        try {
          await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
            owner,
            repo,
            path: file.path,
            message: `Add ${file.path}`,
            content: Buffer.from(file.content).toString('base64'),
            branch: branchName,
          });
        } catch (error) {
          console.error(`Failed to create file ${file.path}`, error);
        }
      }

      // Then handle files needing updates
      for (const file of updateNeededFiles) {
        try {
          // First get the current file to get its SHA
          const currentFile = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
            owner,
            repo,
            path: file.path,
            ref: branchName,
          });

          // Check if response is a file and has sha
          if (
            !Array.isArray(currentFile.data) &&
            currentFile.data.type === 'file' &&
            currentFile.data.sha
          ) {
            // Then update the file
            await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
              owner,
              repo,
              path: file.path,
              message: `Update ${file.path}`,
              content: Buffer.from(file.content).toString('base64'),
              sha: currentFile.data.sha,
              branch: branchName,
            });
          }
        } catch (error) {
          console.error(`Failed to update file ${file.path}`, error);
        }
      }
    } else {
      console.log('All prompt files are up to date, no changes needed');
    }
  }
}

export type GetInstallationRepositoriesResult = Awaited<
  ReturnType<typeof GitHubService.prototype.getInstallationRepositories>
>;

export type GetProjectRepositoriesForOrganizationResult = Awaited<
  ReturnType<typeof GitHubService.prototype.getProjectRepositoriesForOrganization>
>;

export type GetProjectRepositoryResult = Awaited<
  ReturnType<typeof GitHubService.prototype.getProjectRepository>
>;

export type CreateAppInstallationRecordResult = Awaited<
  ReturnType<typeof GitHubService.prototype.createAppInstallationRecord>
>;

export type FileToSync = {
  path: string;
  content: string;
};
