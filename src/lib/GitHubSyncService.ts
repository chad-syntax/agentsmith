import { SupabaseClient } from '@supabase/supabase-js';
import { AgentsmithSupabaseService } from './AgentsmithSupabaseService';
import { Database } from '@/app/__generated__/supabase.types';
import { Octokit } from '@octokit/core';
import type {
  GetProjectRepositoryByInstallationIdResult,
  GetProjectRepositoryByProjectIdResult,
} from './ProjectsService';
import { GitHubSyncInstance, SyncChange } from './sync/GitHubSyncInstance';

const AGENTSMITH_PR_LABEL = 'agentsmith-sync';

// Result structure for the main sync operation (Revised V2 - Union Type)
type BaseSyncResult = {
  message: string;
  syncChanges?: SyncChange[];
};

type SyncSuccessResult = BaseSyncResult & {
  status: 'success';
  changesMade: boolean;
  pullRequest?: {
    number: number;
    url: string;
    branchName: string;
  }; // PR might not be created even on success (e.g., repo -> agentsmith sync)
};

type SyncErrorResult = BaseSyncResult & {
  status: 'error';
  changesMade: boolean; // Could be true if error occurred after some changes
  error: Error;
};

type SyncNoChangesResult = BaseSyncResult & {
  status: 'no_changes';
  changesMade: false;
};

type SyncInProgressResult = BaseSyncResult & {
  status: 'sync_in_progress';
  changesMade: false;
};

export type SyncResult =
  | SyncSuccessResult
  | SyncErrorResult
  | SyncNoChangesResult
  | SyncInProgressResult;

type PullRequestDetail = {
  number: number;
  title: string;
  htmlUrl: string;
};

type FindExistingAgentsmithPrOptions = {
  octokit: Octokit;
  owner: string;
  repo: string;
  branchRef: string | null;
};

type DeleteBranchOptions = {
  octokit: Octokit;
  owner: string;
  repo: string;
  branchName: string;
};

type GitHubSyncServiceConstructorOptions = {
  supabase: SupabaseClient<Database>;
};

type SyncOptionsFromAgentsmith = {
  projectRepository: NonNullable<GetProjectRepositoryByProjectIdResult>;
  source: 'agentsmith';
};

type SyncOptionsFromRepo = {
  projectRepository: NonNullable<GetProjectRepositoryByInstallationIdResult>;
  source: 'repo';
  branchRef: string;
  isMainBranch: boolean;
};

type SyncOptions = SyncOptionsFromAgentsmith | SyncOptionsFromRepo;

export class GitHubSyncService extends AgentsmithSupabaseService {
  constructor(options: GitHubSyncServiceConstructorOptions) {
    super({ ...options, serviceName: 'githubSync' });
  }

  public async sync(options: SyncOptions): Promise<SyncResult> {
    const { projectRepository, source } = options;

    if (!projectRepository.project_id) {
      throw new Error('project_repository must be connected to a project to sync');
    }

    if (!projectRepository.github_app_installations.installation_id) {
      throw new Error('project_repository must be connected to a GitHub App installation to sync');
    }

    const isLocked = projectRepository.sync_status === 'SYNCING';
    const projectName = projectRepository.projects?.name ?? 'Unknown Project';

    if (isLocked) {
      return {
        message: 'Sync already in progress',
        status: 'sync_in_progress',
        changesMade: false,
      };
    }

    const octokit = await this.services.githubApp.app.getInstallationOctokit(
      projectRepository.github_app_installations.installation_id,
    );

    const [owner, repo] = projectRepository.repository_full_name.split('/');
    const isMainBranch = source === 'repo' && options.isMainBranch;

    let lockAcquired = false;
    let pullRequestDetail: PullRequestDetail | null = null;
    let branchRef: string | null = source === 'repo' ? options.branchRef : null;
    let createdNewBranch = false;

    try {
      const existingPr = await this.findExistingAgentsmithPr({
        octokit,
        owner,
        repo,
        branchRef,
      });

      if (existingPr) {
        pullRequestDetail = {
          number: existingPr.number,
          title: existingPr.title,
          htmlUrl: existingPr.html_url,
        };

        branchRef = existingPr.head.ref;
        createdNewBranch = false;
      } else if (source === 'agentsmith' || isMainBranch) {
        const newBranchName = `agentsmith-sync-${Date.now()}`;
        await this.createBranch({
          octokit,
          owner,
          repo,
          baseBranch: projectRepository.repository_default_branch,
          newBranchName,
        });

        branchRef = newBranchName;
        createdNewBranch = true;
      }

      if (!branchRef) {
        throw new Error('branchRef could not be determined for sync');
      }

      const githubSyncInstance = new GitHubSyncInstance({
        supabase: this.supabase,
        octokit,
        owner,
        repo,
        branchRef,
        isMainBranch,
        agentsmithFolder: projectRepository.agentsmith_folder,
        projectId: projectRepository.project_id,
      });

      githubSyncInstance.services = this.services;

      await this.services.events.createSyncStartEvent({
        organizationId: projectRepository.organization_id,
        projectId: projectRepository.project_id,
        projectName,
        source,
      });

      await this.services.projects.lockProjectRepository(projectRepository.id);

      lockAcquired = true;

      const { syncChanges, actionPlan, agentsmithState, repoState, error } =
        await githubSyncInstance.executeSync();

      const changesMade = syncChanges.length > 0;
      const repoChangesMade = syncChanges.filter((change) => change.target === 'repo').length > 0;

      if (error) {
        await this.services.events.createSyncErrorEvent({
          organizationId: projectRepository.organization_id,
          projectId: projectRepository.project_id,
          projectName,
          source,
          details: {
            error: error.message,
            syncChanges,
            actionPlan,
            agentsmithState,
            repoState,
          },
        });

        return {
          message: 'Error syncing project repository',
          status: 'error',
          changesMade,
          error,
        };
      }

      if (repoChangesMade) {
        // create PR if createdNewBranch is true and source is agentsmith
        if (createdNewBranch) {
          const body = `This PR is automatically created by the Agentsmith GitHub Sync service. It is used to sync the project ${projectRepository.projects?.name ?? 'Unknown Project'} from Agentsmith.`;
          const pr = await this.createPullRequest({
            octokit,
            owner,
            repo,
            headBranch: branchRef,
            baseBranch: projectRepository.repository_default_branch,
            title: `Agentsmith Sync: ${projectRepository.projects?.name ?? 'Unknown Project'}`,
            body,
          });

          pullRequestDetail = {
            number: pr.number,
            title: pr.title,
            htmlUrl: pr.html_url,
          };
        }

        await this.services.events.createSyncCompleteEvent({
          organizationId: projectRepository.organization_id,
          projectId: projectRepository.project_id,
          projectName,
          source,
          details: {
            changesMade,
            pullRequestDetail,
            syncChanges,
            actionPlan,
            agentsmithState,
            repoState,
          },
        });

        return {
          message: 'Sync complete',
          status: 'success',
          changesMade,
          syncChanges,
        };
      }

      if (!repoChangesMade && createdNewBranch) {
        await this.deleteBranch({
          octokit,
          owner,
          repo,
          branchName: branchRef,
        });
      }

      await this.services.events.createSyncCompleteEvent({
        organizationId: projectRepository.organization_id,
        projectId: projectRepository.project_id,
        projectName,
        source,
        details: {
          changesMade,
          pullRequestDetail,
          syncChanges,
          actionPlan,
          agentsmithState,
          repoState,
        },
      });

      return {
        message: 'No changes made',
        status: 'no_changes',
        changesMade: false,
      };
    } catch (error) {
      this.logger.error(error, 'Error syncing project repository:');

      await this.services.events.createSyncErrorEvent({
        organizationId: projectRepository.organization_id,
        projectId: projectRepository.project_id,
        projectName,
        source,
        details: {
          pullRequestDetail,
          error: (error as Error).message,
          source,
        },
      });

      if (createdNewBranch && branchRef) {
        await this.deleteBranch({
          octokit,
          owner,
          repo,
          branchName: branchRef,
        });
      }

      return {
        message: 'Error syncing project repository',
        status: 'error',
        changesMade: false,
        error: error as Error,
      };
    } finally {
      if (lockAcquired) {
        await this.services.projects.unlockProjectRepository(projectRepository.id);
      }
    }
  }

  private async findExistingAgentsmithPr(options: FindExistingAgentsmithPrOptions) {
    const { octokit, owner, repo, branchRef } = options;

    // If we have a branchRef, we can try to fetch the pull request from the branchRef
    if (branchRef) {
      try {
        const { data: pullRequests } = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
          owner,
          repo,
          state: 'open',
          head: `${owner}:${branchRef}`,
        });

        if (pullRequests.length > 0) {
          return pullRequests[0];
        }
      } catch (error) {
        this.logger.error(error, 'Error fetching existing pull requests:', { owner, repo });
      }
    }

    // If we don't have a branchRef, we can try to fetch all open pull requests and filter them by the AGENTSMITH_PR_LABEL
    try {
      const { data: pullRequests } = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
        owner,
        repo,
        state: 'open',
      });

      const agentsmithPrs = pullRequests.filter((pr) =>
        pr.labels.some((label: { name: string }) => label.name === AGENTSMITH_PR_LABEL),
      );

      if (agentsmithPrs.length > 1) {
        this.logger.warn(
          `Found ${agentsmithPrs.length} open pull requests with the '${AGENTSMITH_PR_LABEL}' label for ${owner}/${repo}. Using the first one found: #${agentsmithPrs[0].number}.`,
        );
      }
      if (agentsmithPrs.length > 0) {
        return agentsmithPrs[0];
      }
      return null;
    } catch (error) {
      this.logger.error(error, 'Error fetching existing pull requests:', {
        owner,
        repo,
      });
      return null;
    }
  }

  private async createBranch(options: {
    octokit: Octokit;
    owner: string;
    repo: string;
    baseBranch: string;
    newBranchName: string;
  }): Promise<void> {
    const { octokit, owner, repo, baseBranch, newBranchName } = options;
    try {
      const { data: baseBranchData } = await octokit.request(
        'GET /repos/{owner}/{repo}/branches/{branch}',
        {
          owner,
          repo,
          branch: baseBranch,
        },
      );
      const baseSha = baseBranchData.commit.sha;

      await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
        owner,
        repo,
        ref: `refs/heads/${newBranchName}`,
        sha: baseSha,
      });
      this.logger.info(`Branch ${newBranchName} created successfully from ${baseBranch}`);
    } catch (error: any) {
      this.logger.error(error, `Failed to create branch ${newBranchName}:`, {
        owner,
        repo,
      });
      if (error.status === 422) {
        this.logger.warn(`Branch ${newBranchName} might already exist.`, {
          owner,
          repo,
        });
      }
      throw error;
    }
  }

  private async createPullRequest(options: {
    octokit: Octokit;
    owner: string;
    repo: string;
    headBranch: string;
    baseBranch: string;
    title: string;
    body: string;
  }) {
    const { octokit, owner, repo, headBranch, baseBranch, title, body } = options;
    try {
      const { data: pr } = await octokit.request('POST /repos/{owner}/{repo}/pulls', {
        owner,
        repo,
        head: headBranch,
        base: baseBranch,
        title,
        body,
        maintainer_can_modify: true,
        draft: false,
      });
      this.logger.info(`Pull request #${pr.number} created successfully.`);

      await this.applyAgentsmithLabel({
        octokit,
        owner,
        repo,
        prNumber: pr.number,
      });
      return pr;
    } catch (error: any) {
      this.logger.error(error, 'Failed to create pull request:', {
        owner,
        repo,
        headBranch,
        baseBranch,
      });
      if (error.status === 422 && error.message?.includes('No commits between')) {
        this.logger.warn('Pull request creation failed likely because there are no changes yet.', {
          owner,
          repo,
          headBranch,
          baseBranch,
        });
        throw new Error(
          `Cannot create PR for ${headBranch}: No changes found compared to ${baseBranch}. Commit changes first.`,
        );
      } else if (error.status === 422 && error.message?.includes('A pull request already exists')) {
        this.logger.warn('Pull request creation failed because it already exists.', {
          owner,
          repo,
          headBranch,
          baseBranch,
        });
        throw error;
      }
      throw error;
    }
  }

  private async applyAgentsmithLabel(options: {
    octokit: Octokit;
    owner: string;
    repo: string;
    prNumber: number;
  }): Promise<void> {
    const { octokit, owner, repo, prNumber } = options;

    const applyLabel = async () => {
      await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/labels', {
        owner,
        repo,
        issue_number: prNumber,
        labels: [AGENTSMITH_PR_LABEL],
      });
      this.logger.info(`Label '${AGENTSMITH_PR_LABEL}' applied successfully to PR #${prNumber}.`);
    };

    try {
      await applyLabel();
    } catch (error: any) {
      // Check if the error is because the label doesn't exist (typically 404 on the issue/PR when label is unknown?)
      // Or sometimes the error might be on the label itself during validation. Let's check for 404.
      if (error.status === 404) {
        this.logger.warn(
          `Label '${AGENTSMITH_PR_LABEL}' not found for PR #${prNumber}. Attempting to create it.`,
        );
        try {
          // Attempt to create the label
          await octokit.request('POST /repos/{owner}/{repo}/labels', {
            owner,
            repo,
            name: AGENTSMITH_PR_LABEL,
            color: '000000',
            description: 'PRs created by Agentsmith sync',
          });
          this.logger.info(`Label '${AGENTSMITH_PR_LABEL}' created successfully.`);
          // Retry applying the label
          await applyLabel();
        } catch (createError: any) {
          this.logger.error(
            createError,
            `Failed to create label '${AGENTSMITH_PR_LABEL}' or apply it after creation:`,
            {
              owner,
              repo,
              prNumber,
            },
          );
          // Don't fail sync if label creation/application fails after retry
        }
      } else {
        // Log other errors encountered when initially applying the label
        this.logger.error(
          error,
          `Failed to apply label '${AGENTSMITH_PR_LABEL}' to PR #${prNumber}:`,
          {
            owner,
            repo,
            prNumber,
          },
        );
        // Don't fail sync for other label application errors either
      }
    }
  }

  private async deleteBranch(options: DeleteBranchOptions): Promise<void> {
    const { octokit, owner, repo, branchName } = options;

    try {
      await octokit.request('DELETE /repos/{owner}/{repo}/git/refs/heads/{ref}', {
        owner,
        repo,
        ref: branchName,
      });
      this.logger.info(`Deleted unused branch: ${branchName}`);
    } catch (deleteError) {
      this.logger.error(deleteError, `Failed to delete unused branch ${branchName}:`);
    }
  }
}
