import { SupabaseClient } from '@supabase/supabase-js';
import { AgentsmithSupabaseService } from './AgentsmithSupabaseService';
import { Database } from '@/app/__generated__/supabase.types';
import { Octokit } from '@octokit/core';
import { Api } from '@octokit/plugin-rest-endpoint-methods/dist-types/types';
import { GetProjectRepositoryResult } from './GitHubAppService';
import { GetProjectDataResult } from './ProjectsService';
import { components } from '@octokit/openapi-types'; // Import necessary types
import { GetAllPromptsDataResult } from './PromptsService';

export type FileToSync = {
  path: string;
  oldContent: string | null;
  newContent: string | null;
};

type PromptData = GetAllPromptsDataResult[number];
type PromptVersionData = PromptData['prompt_versions'][number];

type PullRequestDetail = {
  number: number;
  title: string;
  htmlUrl: string;
};

// Define a type for the sync result structure returned by syncBranchFiles
type SyncResult = {
  promptsCreated: FileToSync[];
  promptsUpdated: FileToSync[];
  promptsArchived: FileToSync[];
  promptVersionsCreated: FileToSync[];
  promptVersionsUpdated: FileToSync[];
  promptVersionsArchived: FileToSync[];
  promptVariablesCreated: FileToSync[];
  promptVariablesUpdated: FileToSync[];
  promptVariablesArchived: FileToSync[];
};

type SyncBranchFilesResult = SyncResult & {
  changesMade: boolean;
};

type FileMap = Map<string, components['schemas']['git-tree']['tree'][number]>;

type GitHubSyncServiceConstructorOptions = {
  supabase: SupabaseClient<Database>;
};

type FindExistingAgentsmithPrOptions = {
  octokit: Octokit & Api;
  owner: string;
  repo: string;
};

type CreateBranchOptions = {
  octokit: Octokit & Api;
  owner: string;
  repo: string;
  newBranchName: string;
  baseBranchName: string;
};

type CreatePullRequestOptions = {
  octokit: Octokit & Api;
  owner: string;
  repo: string;
  headBranch: string;
  baseBranch: string;
};

type ApplyAgentsmithLabelOptions = {
  octokit: Octokit & Api;
  owner: string;
  repo: string;
  issueNumber: number;
};

type DeleteBranchOptions = {
  octokit: Octokit & Api;
  owner: string;
  repo: string;
  branchName: string;
};

type SyncBranchFilesOptions = {
  octokit: Octokit & Api;
  owner: string;
  repo: string;
  project: NonNullable<GetProjectDataResult>;
  projectRepository: NonNullable<GetProjectRepositoryResult>;
  branchName: string;
};

type GetRepositoryFileMapOptions = {
  octokit: Octokit & Api;
  owner: string;
  repo: string;
  treeSha: string;
};

type GetFileContentOptions = {
  octokit: Octokit & Api;
  owner: string;
  repo: string;
  path: string;
  ref: string;
};

type DetermineChangesBaseOptions = {
  octokit: Octokit & Api;
  owner: string;
  repo: string;
  branchName: string;
  fileMap: FileMap;
};

type DeterminePromptChangesOptions = DetermineChangesBaseOptions & {
  prompt: PromptData;
  promptBasePath: string;
};

type DeterminePromptVersionChangesOptions = DetermineChangesBaseOptions & {
  version: PromptVersionData;
  versionBasePath: string;
};

type DeterminePromptVariableChangesOptions = DetermineChangesBaseOptions & {
  version: PromptVersionData;
  versionBasePath: string;
};

type CommitFilesOptions = {
  octokit: Octokit & Api;
  owner: string;
  repo: string;
  branchName: string;
};

type CommitFileChangesOptions = CommitFilesOptions & {
  filesToCommit: FileToSync[];
};

export class GitHubSyncService extends AgentsmithSupabaseService {
  constructor(options: GitHubSyncServiceConstructorOptions) {
    super({ ...options, serviceName: 'githubSync' });
  }

  async syncRepositoryFromAgentsmith(projectId: number): Promise<void> {
    console.log('begin repository sync for project', projectId);

    const project = await this.services.projects.getProjectDataById(projectId);
    if (!project) throw new Error('Project not found');

    const projectRepository = await this.services.githubApp.getProjectRepository(project.id);
    if (!projectRepository) throw new Error('Project is not connected to a GitHub repository');

    const installationId = projectRepository.github_app_installations.installation_id;
    if (!installationId) throw new Error('Installation ID not found, cannot sync repository');

    const octokit = await this.services.githubApp.app.getInstallationOctokit(installationId);
    const [owner, repo] = projectRepository.repository_full_name.split('/');

    await this.services.events.createSyncStartEvent({
      organizationId: project.organization_id,
      projectId: project.id,
      source: 'agentsmith',
    });

    const existingPr = await this.findExistingAgentsmithPr({ octokit, owner, repo });

    if (existingPr) {
      console.log(
        `Existing PR #${existingPr.number} found, syncing files to branch ${existingPr.head.ref}`,
      );
      const { changesMade, ...syncResult } = await this.syncBranchFiles({
        octokit,
        owner,
        repo,
        project,
        projectRepository,
        branchName: existingPr.head.ref, // Sync to the existing PR's branch
      });

      const pullRequestDetail: PullRequestDetail = {
        number: existingPr.number,
        title: existingPr.title,
        htmlUrl: existingPr.html_url,
      };

      await this.services.events.createSyncCompleteEvent({
        organizationId: project.organization_id,
        projectId: project.id,
        source: 'agentsmith',
        details: { changesMade, pullRequest: pullRequestDetail, syncResult },
      });

      return;
    }

    console.log('No existing agentsmith PR found, creating a new one...');
    const branchName = `agentsmith-sync-${Date.now()}`;

    await this.createBranch({
      octokit,
      owner,
      repo,
      newBranchName: branchName,
      baseBranchName: projectRepository.repository_default_branch,
    });

    const { changesMade, ...syncResult } = await this.syncBranchFiles({
      octokit,
      owner,
      repo,
      project,
      projectRepository,
      branchName,
    });

    if (changesMade) {
      console.log('Changes detected, creating Pull Request...');
      const newPR = await this.createPullRequest({
        octokit,
        owner,
        repo,
        headBranch: branchName,
        baseBranch: projectRepository.repository_default_branch,
      });
      await this.applyAgentsmithLabel({ octokit, owner, repo, issueNumber: newPR.number });

      const pullRequestDetail: PullRequestDetail = {
        number: newPR.number,
        title: newPR.title,
        htmlUrl: newPR.html_url,
      };

      await this.services.events.createSyncCompleteEvent({
        organizationId: project.organization_id,
        projectId: project.id,
        source: 'agentsmith',
        details: { changesMade: true, pullRequest: pullRequestDetail, syncResult },
      });

      return;
    }

    console.log('No file changes detected. Skipping Pull Request creation and deleting branch.');
    await this.deleteBranch({ octokit, owner, repo, branchName });

    await this.services.events.createSyncCompleteEvent({
      organizationId: project.organization_id,
      projectId: project.id,
      source: 'agentsmith',
      details: { changesMade: false },
    });

    console.log('repository sync complete');
  }

  private async findExistingAgentsmithPr(options: FindExistingAgentsmithPrOptions) {
    const { octokit, owner, repo } = options;
    try {
      const { data: pullRequests } = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
        owner,
        repo,
        state: 'open',
        labels: 'agentsmith',
      });
      if (pullRequests.length > 1) {
        console.warn(
          `Found ${pullRequests.length} open pull requests with the 'agentsmith' label for ${owner}/${repo}. Using the first one found: #${pullRequests[0].number}.`,
        );
      }
      return pullRequests.length > 0 ? pullRequests[0] : null;
    } catch (error) {
      console.error('Error fetching existing pull requests:', error);
      return null;
    }
  }

  private async createBranch(options: CreateBranchOptions): Promise<void> {
    const { octokit, owner, repo, newBranchName, baseBranchName } = options;
    const { data: refData } = await octokit.request(
      'GET /repos/{owner}/{repo}/git/ref/heads/{branch}',
      {
        owner,
        repo,
        branch: baseBranchName,
      },
    );
    const sha = refData.object.sha;

    await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
      owner,
      repo,
      ref: `refs/heads/${newBranchName}`,
      sha,
    });
    console.log(`Created branch: ${newBranchName}`);
  }

  private async createPullRequest(options: CreatePullRequestOptions) {
    const { octokit, owner, repo, headBranch, baseBranch } = options;
    const { data: newPR } = await octokit.request('POST /repos/{owner}/{repo}/pulls', {
      owner,
      repo,
      title: 'Agentsmith Sync',
      body: 'Syncing prompts and variables from Agentsmith',
      head: headBranch,
      base: baseBranch,
    });
    console.log(`Created Pull Request #${newPR.number}`);
    return newPR;
  }

  private async applyAgentsmithLabel(options: ApplyAgentsmithLabelOptions): Promise<void> {
    const { octokit, owner, repo, issueNumber } = options;
    const labelName = 'agentsmith';
    try {
      await octokit.request('GET /repos/{owner}/{repo}/labels/{name}', {
        owner,
        repo,
        name: labelName,
      });
    } catch (error: any) {
      if (error.status === 404) {
        console.log(`Label "${labelName}" not found, creating it...`);
        await octokit.request('POST /repos/{owner}/{repo}/labels', {
          owner,
          repo,
          name: labelName,
          color: '0E8A16',
          description: 'PRs created by Agentsmith',
        });
        console.log(`Label "${labelName}" created.`);
      } else {
        console.error(`Error checking label "${labelName}":`, error);
        throw error; // Re-throw other errors
      }
    }

    await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/labels', {
      owner,
      repo,
      issue_number: issueNumber,
      labels: [labelName],
    });
    console.log(`Applied label "${labelName}" to PR #${issueNumber}`);
  }

  private async deleteBranch(options: DeleteBranchOptions): Promise<void> {
    const { octokit, owner, repo, branchName } = options;
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
  }

  private async syncBranchFiles(options: SyncBranchFilesOptions): Promise<SyncBranchFilesResult> {
    const { octokit, owner, repo, project, projectRepository, branchName } = options;
    const promptsData = await this.services.prompts.getAllPromptsData(project.id);
    const fileMap = await this.getRepositoryFileMap({ octokit, owner, repo, treeSha: branchName });

    const allChangedFiles: FileToSync[] = [];

    const syncResult: SyncResult = {
      promptsCreated: [],
      promptsUpdated: [],
      promptsArchived: [],
      promptVersionsCreated: [],
      promptVersionsUpdated: [],
      promptVersionsArchived: [],
      promptVariablesCreated: [],
      promptVariablesUpdated: [],
      promptVariablesArchived: [],
    };

    for (const prompt of promptsData) {
      const promptBasePath = `${projectRepository.agentsmith_folder}/prompts/${prompt.slug}`;

      const promptChanges = await this.determinePromptChanges({
        octokit,
        owner,
        repo,
        branchName,
        fileMap,
        prompt,
        promptBasePath,
      });
      allChangedFiles.push(...promptChanges);
      promptChanges.forEach((file) => {
        if (file.oldContent === null) syncResult.promptsCreated.push(file);
        else if (file.newContent !== null) syncResult.promptsUpdated.push(file);
        else syncResult.promptsArchived.push(file);
      });

      for (const version of prompt.prompt_versions || []) {
        const versionBasePath = `${promptBasePath}/${version.version}`;

        const versionChanges = await this.determinePromptVersionChanges({
          octokit,
          owner,
          repo,
          branchName,
          fileMap,
          version,
          versionBasePath,
        });
        allChangedFiles.push(...versionChanges);
        versionChanges.forEach((file) => {
          if (file.oldContent === null) syncResult.promptVersionsCreated.push(file);
          else if (file.newContent !== null) syncResult.promptVersionsUpdated.push(file);
          else syncResult.promptVersionsArchived.push(file);
        });

        const variableChanges = await this.determinePromptVariableChanges({
          octokit,
          owner,
          repo,
          branchName,
          fileMap,
          version,
          versionBasePath,
        });
        allChangedFiles.push(...variableChanges);
        variableChanges.forEach((file) => {
          if (file.oldContent === null) syncResult.promptVariablesCreated.push(file);
          else if (file.newContent !== null) syncResult.promptVariablesUpdated.push(file);
          else syncResult.promptVariablesArchived.push(file);
        });
      }
    }

    const changesMade = allChangedFiles.length > 0;

    if (changesMade) {
      console.log(`Sync detected ${allChangedFiles.length} file changes.`);
      await this.commitFileChanges({
        octokit,
        owner,
        repo,
        branchName,
        filesToCommit: allChangedFiles,
      });
    } else {
      console.log('All prompt files are up to date, no changes needed in the branch.');
    }

    return { changesMade, ...syncResult };
  }

  private async getRepositoryFileMap(options: GetRepositoryFileMapOptions): Promise<FileMap> {
    const { octokit, owner, repo, treeSha } = options;
    const fileMap = new Map<string, components['schemas']['git-tree']['tree'][0]>();
    try {
      const { data } = await octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
        owner,
        repo,
        tree_sha: treeSha,
        recursive: '1',
      });
      data.tree.forEach((file) => {
        if (file.path && file.type === 'blob') {
          fileMap.set(file.path, file);
        }
      });
    } catch (error: any) {
      if (error.status === 404) {
        console.log(
          `Branch or tree "${treeSha}" not found. Assuming empty repository state for sync.`,
        );
        return fileMap;
      }
      console.error(`Failed to fetch repository file structure for tree "${treeSha}":`, error);
      throw error;
    }
    return fileMap;
  }

  private async getFileContent(options: GetFileContentOptions): Promise<string | null> {
    const { octokit, owner, repo, path, ref } = options;
    try {
      const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path,
        ref,
      });

      if (!Array.isArray(data) && data.type === 'file' && data.content) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      console.warn(
        `Could not get file content for ${path} at ref ${ref}. Response type was not 'file' or content was missing.`,
      );
      return null;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      console.error(`Failed to fetch content for ${path} at ref ${ref}:`, error);
      return null;
    }
  }

  private async determinePromptChanges(
    options: DeterminePromptChangesOptions,
  ): Promise<FileToSync[]> {
    const { octokit, owner, repo, branchName, fileMap, prompt, promptBasePath } = options;

    const changedFiles: FileToSync[] = [];
    const filePath = `${promptBasePath}/prompt.json`;
    const { id, project_id, prompt_versions, ...promptRest } = prompt;
    const expectedJsonData = {
      ...promptRest,
      versions: (prompt_versions || []).map((v) => ({ version: v.version, status: v.status })),
    };
    const expectedContent = JSON.stringify(expectedJsonData, null, 2);

    if (!fileMap.has(filePath)) {
      changedFiles.push({ path: filePath, oldContent: null, newContent: expectedContent });
    } else {
      const existingContent = await this.getFileContent({
        octokit,
        owner,
        repo,
        path: filePath,
        ref: branchName,
      });
      if (existingContent !== expectedContent) {
        changedFiles.push({
          path: filePath,
          oldContent: existingContent,
          newContent: expectedContent,
        });
      }
    }

    return changedFiles;
  }

  private async determinePromptVersionChanges(
    options: DeterminePromptVersionChangesOptions,
  ): Promise<FileToSync[]> {
    const { octokit, owner, repo, branchName, fileMap, version, versionBasePath } = options;

    const changedFiles: FileToSync[] = [];
    const filePath = `${versionBasePath}/version.json`;
    const { id, prompt_id, prompt_variables, ...versionRest } = version;
    const expectedJsonData = versionRest;

    if (version.status === 'ARCHIVED') {
      if (fileMap.has(filePath)) {
        const existingContent = await this.getFileContent({
          octokit,
          owner,
          repo,
          path: filePath,
          ref: branchName,
        });

        if (existingContent !== null) {
          changedFiles.push({ path: filePath, oldContent: existingContent, newContent: null });
        }
      }

      return changedFiles;
    }

    const expectedContent = JSON.stringify(expectedJsonData, null, 2);

    if (!fileMap.has(filePath)) {
      changedFiles.push({ path: filePath, oldContent: null, newContent: expectedContent });
    } else {
      const existingContent = await this.getFileContent({
        octokit,
        owner,
        repo,
        path: filePath,
        ref: branchName,
      });
      if (existingContent !== expectedContent) {
        changedFiles.push({
          path: filePath,
          oldContent: existingContent,
          newContent: expectedContent,
        });
      }
    }
    return changedFiles;
  }

  private async determinePromptVariableChanges(
    options: DeterminePromptVariableChangesOptions,
  ): Promise<FileToSync[]> {
    const { octokit, owner, repo, branchName, fileMap, version, versionBasePath } = options;
    const changedFiles: FileToSync[] = [];
    const filePath = `${versionBasePath}/variables.json`;

    const fileExists = fileMap.has(filePath);

    if (version.status === 'ARCHIVED') {
      if (fileExists) {
        const existingContent = await this.getFileContent({
          octokit,
          owner,
          repo,
          path: filePath,
          ref: branchName,
        });

        if (existingContent !== null) {
          changedFiles.push({ path: filePath, oldContent: existingContent, newContent: null });
        }
      }

      return changedFiles;
    }

    let expectedContent: string | null = null;
    if (version.prompt_variables && version.prompt_variables.length > 0) {
      const variablesJsonData = version.prompt_variables.map((variable) => {
        const { id, prompt_version_id, ...rest } = variable;
        return rest;
      });
      expectedContent = JSON.stringify(variablesJsonData, null, 2);
    }

    if (!fileExists && expectedContent !== null) {
      changedFiles.push({ path: filePath, oldContent: null, newContent: expectedContent });
    } else if (fileExists) {
      const existingContent = await this.getFileContent({
        octokit,
        owner,
        repo,
        path: filePath,
        ref: branchName,
      });
      if (existingContent !== expectedContent) {
        changedFiles.push({
          path: filePath,
          oldContent: existingContent,
          newContent: expectedContent,
        });
      }
    }
    return changedFiles;
  }

  private async commitFileChanges(options: CommitFileChangesOptions): Promise<void> {
    const { octokit, owner, repo, branchName, filesToCommit } = options;

    for (const file of filesToCommit) {
      const isCreate = file.oldContent === null && file.newContent !== null;
      const isUpdate = file.oldContent !== null && file.newContent !== null;
      const isDelete = file.oldContent !== null && file.newContent === null;
      const isInvalid = file.oldContent === null && file.newContent === null;

      if (isInvalid) {
        console.warn(
          `Invalid state for file change commit (both old and new content are null): ${file.path}. Skipping.`,
        );
        continue;
      }

      try {
        let sha: string | undefined = undefined;
        if (isUpdate || isDelete) {
          try {
            const { data: currentFile } = await octokit.request(
              'GET /repos/{owner}/{repo}/contents/{path}',
              {
                owner,
                repo,
                path: file.path,
                ref: branchName,
              },
            );
            if (Array.isArray(currentFile) || currentFile.type !== 'file' || !currentFile.sha) {
              console.error(
                `Could not get valid SHA for file ${file.path} needed for update/delete. Skipping change.`,
              );
              continue;
            }
            sha = currentFile.sha;
          } catch (getError: any) {
            if (getError.status === 404) {
              if (isDelete) {
                console.warn(
                  `Attempted to delete ${file.path}, but it was not found (perhaps already deleted?). Skipping.`,
                );
                continue;
              } else {
                console.error(
                  `Attempted to update ${file.path}, but it was not found. Skipping. Error:`,
                  getError,
                );
                continue;
              }
            } else {
              throw getError;
            }
          }
        }

        if (isCreate) {
          console.log(`Creating file: ${file.path}`);
          await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
            owner,
            repo,
            path: file.path,
            message: `[Agentsmith Sync] CREATE - ${file.path}`,
            content: Buffer.from(file.newContent!).toString('base64'),
            branch: branchName,
          });
        } else if (isUpdate) {
          console.log(`Updating file: ${file.path}`);
          if (!sha) {
            console.error(`Missing SHA for update operation on ${file.path}. Skipping.`);
            continue;
          }
          await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
            owner,
            repo,
            path: file.path,
            message: `[Agentsmith Sync] UPDATE - ${file.path}`,
            content: Buffer.from(file.newContent!).toString('base64'),
            sha: sha, // Must have SHA for update
            branch: branchName,
          });
        } else if (isDelete) {
          console.log(`Deleting file: ${file.path}`);
          if (!sha) {
            console.error(`Missing SHA for delete operation on ${file.path}. Skipping.`);
            continue;
          }
          await octokit.request('DELETE /repos/{owner}/{repo}/contents/{path}', {
            owner,
            repo,
            path: file.path,
            message: `[Agentsmith Sync] DELETE - ${file.path}`,
            sha: sha, // Must have SHA for delete
            branch: branchName,
          });
        }
      } catch (commitError: any) {
        if (commitError.status === 409) {
          console.error(
            `Conflict error (409) during commit for ${file.path}. Branch may have been updated externally or SHA mismatch. Aborting change for this file. Error:`,
            commitError,
          );
        } else {
          console.error(
            `Failed to commit change for file ${file.path} in branch ${branchName}:`,
            commitError,
          );
        }
      }
    }
  }
}
