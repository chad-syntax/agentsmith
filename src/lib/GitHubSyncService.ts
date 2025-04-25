import { SupabaseClient } from '@supabase/supabase-js';
import { AgentsmithSupabaseService } from './AgentsmithSupabaseService';
import { Database } from '@/app/__generated__/supabase.types';
import { Octokit } from '@octokit/core';
import { Api } from '@octokit/plugin-rest-endpoint-methods/dist-types/types';
import { GetProjectRepositoryResult } from './GitHubAppService';
import { GetProjectDataResult } from './ProjectsService';

export type FileToSync = {
  path: string;
  oldContent: string | null;
  newContent: string | null;
};

type PullRequestDetail = {
  number: number;
  title: string;
  htmlUrl: string;
};

type GitHubSyncServiceConstructorOptions = {
  supabase: SupabaseClient<Database>;
};

export class GitHubSyncService extends AgentsmithSupabaseService {
  constructor(options: GitHubSyncServiceConstructorOptions) {
    super({ ...options, serviceName: 'githubSync' });
  }

  // gets triggered by "sync" button press
  async syncRepositoryFromAgentsmith(projectUuid: string) {
    console.log('begin repository sync for project', projectUuid);

    // fetch the project that is connected to the project repository
    const project = await this.services.projects.getProjectData(projectUuid);

    if (!project) {
      throw new Error('Project not found');
    }

    const projectRepository = await this.services.githubApp.getProjectRepository(project.id);

    if (!projectRepository) {
      throw new Error('Project is not connected to a GitHub repository');
    }

    const installationId = projectRepository.github_app_installations.installation_id;

    if (!installationId) {
      throw new Error('Installation ID not found, cannot sync repository');
    }

    const octokit = await this.services.githubApp.app.getInstallationOctokit(installationId);

    const [owner, repo] = projectRepository.repository_full_name.split('/');

    await this.services.events.createSyncStartEvent({
      organizationId: project.organization_id,
      projectId: project.id,
      source: 'agentsmith',
    });

    // check repository for any pending pull requests that are agentsmith pull requests
    const pullRequests = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
      owner,
      repo,
      state: 'open',
      labels: 'agentsmith',
    });

    if (pullRequests.data.length > 0) {
      console.log('pending pull requests found, running this.syncPRFiles');
      const pullRequest = pullRequests.data[0];
      const { changesMade, ...syncResult } = await this.syncBranchFiles(
        octokit,
        owner,
        repo,
        project,
        projectRepository,
        pullRequest.head.ref,
      );

      const pullRequestDetail: PullRequestDetail = {
        number: pullRequest.number,
        title: pullRequest.title,
        htmlUrl: pullRequest.html_url,
      };

      await this.services.events.createSyncCompleteEvent({
        organizationId: project.organization_id,
        projectId: project.id,
        source: 'agentsmith',
        details: {
          changesMade,
          pullRequest: pullRequestDetail,
          syncResult,
        },
      });
    } else {
      console.log('no pull requests found, creating new PR...');

      // 2. Get the latest commit SHA from the default branch
      const { data: ref } = await octokit.request(
        'GET /repos/{owner}/{repo}/git/ref/heads/{branch}',
        {
          owner,
          repo,
          branch: projectRepository.repository_default_branch,
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
      const { changesMade: wereChangesMade, ...syncResult } = await this.syncBranchFiles(
        octokit,
        owner,
        repo,
        project,
        projectRepository,
        branchName,
      );

      if (wereChangesMade) {
        // 5. Create a new PR only if changes were made
        const { data: newPR } = await octokit.request('POST /repos/{owner}/{repo}/pulls', {
          owner,
          repo,
          title: 'Agentsmith Sync',
          body: 'Syncing prompts and variables from Agentsmith',
          head: branchName,
          base: projectRepository.repository_default_branch,
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

        const pullRequestDetail: PullRequestDetail = {
          number: newPR.number,
          title: newPR.title,
          htmlUrl: newPR.html_url,
        };

        await this.services.events.createSyncCompleteEvent({
          organizationId: project.organization_id,
          projectId: project.id,
          source: 'agentsmith',
          details: {
            changesMade: true,
            pullRequest: pullRequestDetail,
            syncResult,
          },
        });
      } else {
        // No changes were made, so no PR is needed. We might want to delete the unused branch.
        console.log('No file changes detected. Skipping Pull Request creation.');
        // Optional: Delete the newly created branch since it's identical to the base
        try {
          await octokit.request('DELETE /repos/{owner}/{repo}/git/refs/heads/{ref}', {
            owner,
            repo,
            ref: branchName,
          });
          console.log(`Deleted unused branch: ${branchName}`);
        } catch (deleteError) {
          console.error(`Failed to delete unused branch ${branchName}:`, deleteError);
        }

        await this.services.events.createSyncCompleteEvent({
          organizationId: project.organization_id,
          projectId: project.id,
          source: 'agentsmith',
          details: {
            changesMade: false,
          },
        });
      }
    }

    console.log('repository sync complete');
  }

  // Helper method to sync files to a branch with or without an existing PR
  private async syncBranchFiles(
    octokit: Octokit & Api,
    owner: string,
    repo: string,
    project: NonNullable<GetProjectDataResult>,
    projectRepository: NonNullable<GetProjectRepositoryResult>,
    branchName: string,
  ): Promise<{
    changesMade: boolean;
    promptsCreated: FileToSync[];
    promptsUpdated: FileToSync[];
    promptsArchived: FileToSync[];
    promptVersionsCreated: FileToSync[];
    promptVersionsUpdated: FileToSync[];
    promptVersionsArchived: FileToSync[];
    promptVariablesCreated: FileToSync[];
    promptVariablesUpdated: FileToSync[];
    promptVariablesArchived: FileToSync[];
  }> {
    const promptsData = await this.services.prompts.getAllPromptsData(project.id);

    // Check if all prompts and prompt versions exist in the repository
    const missingFiles: FileToSync[] = [];
    const updateNeededFiles: FileToSync[] = [];
    let changesMade = false; // Flag to track if changes were committed

    // Specific tracking arrays
    const promptsCreated: FileToSync[] = [];
    const promptsUpdated: FileToSync[] = [];
    const promptsArchived: FileToSync[] = [];
    const promptVersionsCreated: FileToSync[] = [];
    const promptVersionsUpdated: FileToSync[] = [];
    const promptVersionsArchived: FileToSync[] = [];
    const promptVariablesCreated: FileToSync[] = [];
    const promptVariablesUpdated: FileToSync[] = [];
    const promptVariablesArchived: FileToSync[] = [];

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

      // 1. Prepare data for prompt.json
      const { id, project_id, prompt_versions, ...promptRest } = prompt;
      const promptJsonData = {
        ...promptRest,
        versions: (prompt_versions || []).map((v) => ({
          version: v.version,
          status: v.status,
        })),
      };

      const promptJsonContent = JSON.stringify(promptJsonData, null, 2);

      // Check if prompt.json exists
      if (!fileMap.has(promptJsonPath)) {
        const fileData: FileToSync = {
          path: promptJsonPath,
          oldContent: null,
          newContent: promptJsonContent,
        };
        missingFiles.push(fileData);
        promptsCreated.push(fileData);
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
            if (existingContent !== promptJsonContent) {
              const fileData: FileToSync = {
                path: promptJsonPath,
                oldContent: existingContent,
                newContent: promptJsonContent,
              };
              updateNeededFiles.push(fileData);
              promptsUpdated.push(fileData);
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

        // 2. Prepare data for version.json
        const { id, prompt_id, prompt_variables, ...versionRest } = version;
        const versionJsonData = versionRest;

        const versionJsonContent = JSON.stringify(versionJsonData, null, 2);

        // 3. Prepare data for variables.json
        let variablesJsonContent: string | null = null;
        if (version.prompt_variables && version.prompt_variables.length > 0) {
          const variablesJsonData = version.prompt_variables.map((variable) => {
            const { id, prompt_version_id, ...rest } = variable;
            return rest;
          });
          variablesJsonContent = JSON.stringify(variablesJsonData, null, 2);
        }

        // Check if version.json exists
        if (!fileMap.has(versionJsonPath)) {
          const fileData: FileToSync = {
            path: versionJsonPath,
            oldContent: null,
            newContent: versionJsonContent,
          };
          missingFiles.push(fileData);
          promptVersionsCreated.push(fileData);
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
              if (existingContent !== versionJsonContent) {
                const fileData: FileToSync = {
                  path: versionJsonPath,
                  oldContent: existingContent,
                  newContent: versionJsonContent,
                };
                updateNeededFiles.push(fileData);
                promptVersionsUpdated.push(fileData);
              }
            }
          } catch (error) {
            console.error(`Failed to fetch content for ${versionJsonPath}`, error);
          }
        }

        // Check if variables.json exists
        if (variablesJsonContent) {
          if (!fileMap.has(variablesJsonPath)) {
            const fileData: FileToSync = {
              path: variablesJsonPath,
              oldContent: null,
              newContent: variablesJsonContent,
            };
            missingFiles.push(fileData);
            promptVariablesCreated.push(fileData);
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
                if (existingContent !== variablesJsonContent) {
                  const fileData: FileToSync = {
                    path: variablesJsonPath,
                    oldContent: existingContent,
                    newContent: variablesJsonContent,
                  };
                  updateNeededFiles.push(fileData);
                  promptVariablesUpdated.push(fileData);
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
      changesMade = true; // Set flag as changes are detected

      // Update or create files in the pull request
      // First handle missing files
      for (const file of missingFiles) {
        try {
          await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
            owner,
            repo,
            path: file.path,
            message: `Add ${file.path}`,
            content: Buffer.from(file.newContent!).toString('base64'),
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
              content: Buffer.from(file.newContent!).toString('base64'),
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

    return {
      changesMade,
      promptsCreated,
      promptsUpdated,
      promptsArchived,
      promptVersionsCreated,
      promptVersionsUpdated,
      promptVersionsArchived,
      promptVariablesCreated,
      promptVariablesUpdated,
      promptVariablesArchived,
    };
  }
}
