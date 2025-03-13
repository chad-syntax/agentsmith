import { App } from 'octokit';
import {
  AgentsmithSupabaseService,
  AgentsmithSupabaseServiceConstructorOptions,
} from './AgentsmithSupabaseService';
import { EmitterWebhookEvent } from '@octokit/webhooks/dist-types/types';
import { Octokit } from '@octokit/core';
import { Api } from '@octokit/plugin-rest-endpoint-methods/dist-types/types';
import { GetProjectDataResult } from './ProjectsService';

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
  public app: App;

  constructor(options: AgentsmithSupabaseServiceConstructorOptions) {
    super({ ...options, serviceName: 'github' });

    const appId = process.env.GITHUB_APP_ID as string;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY as string;
    const webhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET as string;

    if (!appId || !privateKey || !webhookSecret) {
      throw new Error('GitHub app credentials not found');
    }

    this.app = new App({
      appId,
      privateKey: Buffer.from(privateKey, 'base64').toString('utf8'),
      webhooks: {
        secret: webhookSecret,
      },
    });

    this.app.webhooks.on('installation', async ({ payload }) => {
      await this.handleInstallationWebhook(payload);
    });

    this.app.webhooks.on('pull_request.opened', async ({ payload }) => {
      try {
        // Do something
        console.log('github webhook: pull request opened', payload);
      } catch (e) {
        console.error(
          `pull_request.opened handler failed with error: ${(<Error>e).message}`
        );
      }
    });

    this.app.webhooks.on('pull_request.edited', async ({ payload }) => {
      try {
        // Do something else
        console.log('github webhook: pull request edited', payload);
      } catch (e) {
        console.error(
          `pull_request.edited handler failed with error: ${(<Error>e).message}`
        );
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
    console.log('handleInstallationWebhook', payload);
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
    const octokit = await this.app.getInstallationOctokit(installationId);
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
      projectRepository.github_app_installation_id
    );

    const [owner, repo] = projectRepository.repository_full_name.split('/');

    // check repository for any pending pull requests that are agentsmith pull requests
    const pullRequests = await octokit.request(
      'GET /repos/{owner}/{repo}/pulls',
      {
        owner,
        repo,
        state: 'open',
        labels: 'agentsmith',
      }
    );

    if (pullRequests.data.length > 0) {
      const pullRequest = pullRequests.data[0];
      await this.syncPRFiles(
        octokit,
        owner,
        repo,
        project,
        projectRepository,
        pullRequest.head.ref
      );
    } else {
      // Create a new PR
      // 1. Get default branch
      const { data: repository } = await octokit.request(
        'GET /repos/{owner}/{repo}',
        {
          owner,
          repo,
        }
      );

      const defaultBranch = repository.default_branch;

      // 2. Get the latest commit SHA from the default branch
      const { data: ref } = await octokit.request(
        'GET /repos/{owner}/{repo}/git/ref/heads/{branch}',
        {
          owner,
          repo,
          branch: defaultBranch,
        }
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
      await this.syncPRFiles(
        octokit,
        owner,
        repo,
        project,
        projectRepository,
        branchName
      );

      // 5. Create a new PR
      const { data: newPR } = await octokit.request(
        'POST /repos/{owner}/{repo}/pulls',
        {
          owner,
          repo,
          title: 'Agentsmith Sync',
          body: 'Syncing prompts and variables from Agentsmith',
          head: branchName,
          base: defaultBranch,
        }
      );

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
      await octokit.request(
        'POST /repos/{owner}/{repo}/issues/{issue_number}/labels',
        {
          owner,
          repo,
          issue_number: newPR.number,
          labels: ['agentsmith'],
        }
      );
    }
  }

  // Helper method to sync files to a branch with or without an existing PR
  private async syncPRFiles(
    octokit: Octokit & Api,
    owner: string,
    repo: string,
    project: NonNullable<GetProjectDataResult>,
    projectRepository: NonNullable<GetProjectRepositoryResult>,
    branchName: string
  ) {
    const promptsData = await this.services.prompts.getAllPromptsData(
      project.id
    );

    // Check if all prompts and prompt versions exist in the repository
    const missingFiles: FileToSync[] = [];
    const updateNeededFiles: FileToSync[] = [];

    // Retrieve the current state of the agentsmith folder
    let repoFiles;
    try {
      const response = await octokit.request(
        'GET /repos/{owner}/{repo}/git/trees/{tree_sha}',
        {
          owner,
          repo,
          tree_sha: branchName,
          recursive: '1',
        }
      );
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
          const fileContent = await octokit.request(
            'GET /repos/{owner}/{repo}/contents/{path}',
            {
              owner,
              repo,
              path: promptJsonPath,
              ref: branchName,
            }
          );

          // Check if response is a file and has content
          if (
            !Array.isArray(fileContent.data) &&
            fileContent.data.type === 'file' &&
            fileContent.data.content
          ) {
            const existingContent = Buffer.from(
              fileContent.data.content,
              'base64'
            ).toString();
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
            const fileContent = await octokit.request(
              'GET /repos/{owner}/{repo}/contents/{path}',
              {
                owner,
                repo,
                path: versionJsonPath,
                ref: branchName,
              }
            );

            // Check if response is a file and has content
            if (
              !Array.isArray(fileContent.data) &&
              fileContent.data.type === 'file' &&
              fileContent.data.content
            ) {
              const existingContent = Buffer.from(
                fileContent.data.content,
                'base64'
              ).toString();
              const currentContent = JSON.stringify(version, null, 2);

              if (existingContent !== currentContent) {
                updateNeededFiles.push({
                  path: versionJsonPath,
                  content: currentContent,
                });
              }
            }
          } catch (error) {
            console.error(
              `Failed to fetch content for ${versionJsonPath}`,
              error
            );
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
                }
              );

              // Check if response is a file and has content
              if (
                !Array.isArray(fileContent.data) &&
                fileContent.data.type === 'file' &&
                fileContent.data.content
              ) {
                const existingContent = Buffer.from(
                  fileContent.data.content,
                  'base64'
                ).toString();
                const currentContent = JSON.stringify(
                  version.prompt_variables,
                  null,
                  2
                );

                if (existingContent !== currentContent) {
                  updateNeededFiles.push({
                    path: variablesJsonPath,
                    content: currentContent,
                  });
                }
              }
            } catch (error) {
              console.error(
                `Failed to fetch content for ${variablesJsonPath}`,
                error
              );
            }
          }
        }
      }
    }

    // If there are missing or outdated files, update the pull request
    if (missingFiles.length > 0 || updateNeededFiles.length > 0) {
      console.log(
        `Found ${missingFiles.length} missing files and ${updateNeededFiles.length} files needing updates`
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
          const currentFile = await octokit.request(
            'GET /repos/{owner}/{repo}/contents/{path}',
            {
              owner,
              repo,
              path: file.path,
              ref: branchName,
            }
          );

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
  ReturnType<
    typeof GitHubService.prototype.getProjectRepositoriesForOrganization
  >
>;

export type SaveProjectRepositoryResult = Awaited<
  ReturnType<typeof GitHubService.prototype.saveProjectRepository>
>;

export type GetProjectRepositoryResult = Awaited<
  ReturnType<typeof GitHubService.prototype.getProjectRepository>
>;

export type FileToSync = {
  path: string;
  content: string;
};
