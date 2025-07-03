import {
  AgentsmithSupabaseService,
  AgentsmithSupabaseServiceConstructorOptions,
} from './AgentsmithSupabaseService';
import { EmitterWebhookEvent } from '@octokit/webhooks';

export class GitHubWebhookService extends AgentsmithSupabaseService {
  constructor(options: AgentsmithSupabaseServiceConstructorOptions) {
    super({ ...options, serviceName: 'githubWebhook' });
  }

  public initialize() {
    const app = this.services.githubApp.app;

    app.webhooks.on('installation.suspend', async ({ payload }) => {
      await this.handleInstallationSuspended(payload);
    });

    app.webhooks.on('installation.unsuspend', async ({ payload }) => {
      await this.handleInstallationUnsuspended(payload);
    });

    app.webhooks.on('installation.deleted', async ({ payload }) => {
      await this.handleInstallationDeleted(payload);
    });

    app.webhooks.on('installation_repositories.added', async ({ payload }) => {
      await this.handleInstallationRepositoriesAdded(payload);
    });

    app.webhooks.on('installation_repositories.removed', async ({ payload }) => {
      await this.handleInstallationRepositoriesRemoved(payload);
    });

    app.webhooks.on('pull_request.opened', async ({ payload }) => {
      try {
        // Do something
        this.logger.info('github webhook: pull request opened');
      } catch (e) {
        this.logger.error(e, 'pull_request.opened handler failed with error');
      }
    });

    app.webhooks.on('pull_request.edited', async ({ payload }) => {
      try {
        // Do something else
        this.logger.info('github webhook: pull request edited', payload);
      } catch (e) {
        this.logger.error(e, 'pull_request.edited handler failed with error');
      }
    });

    app.webhooks.on('push', async ({ payload }) => {
      try {
        await this.handlePush(payload);
      } catch (e) {
        this.logger.error(e, 'push handler failed with error');
      }
    });
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
        this.logger.error(error, 'Failed to update installation status to DELETED:');
        throw error;
      }
    } catch (e) {
      this.logger.error(e, 'installation.deleted handler failed with error');
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
        this.logger.error(error, 'Failed to update installation status to SUSPENDED:');
      }
    } catch (e) {
      this.logger.error(e, 'installation.suspended handler failed with error');
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
        this.logger.error(error, 'Failed to update installation status to ACTIVE:');
        throw error;
      }
    } catch (e) {
      this.logger.error(e, 'installation.unsuspend handler failed with error');
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

      // Fetch full repository data to get accurate default branch info
      const octokit = await this.services.githubApp.app.getInstallationOctokit(installation.id);
      const fullRepoData = await Promise.all(
        repositories_added.map(async (repoAdded) => {
          const [owner, repo] = repoAdded.full_name.split('/');

          const { data } = await octokit.request('GET /repos/{owner}/{repo}', {
            owner,
            repo,
          });
          return data;
        }),
      );

      const { error } = await this.supabase.from('project_repositories').insert(
        fullRepoData.map((repo) => ({
          github_app_installation_id: installationRecord.id,
          organization_id: installationRecord.organizations.id,
          repository_id: repo.id,
          repository_name: repo.name,
          repository_full_name: repo.full_name,
          repository_default_branch: repo.default_branch,
        })),
      );

      if (error) {
        this.logger.error(error, 'Failed to insert repository records:');
        throw error;
      }
    } catch (e) {
      this.logger.error(e, 'installation_repositories.added handler failed with error');
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
        this.logger.error(error, 'Failed to delete repository records:');
        throw error;
      }
    } catch (e) {
      this.logger.error(e, 'installation_repositories.removed handler failed with error');
    }
  }

  private async handlePush(payload: EmitterWebhookEvent<'push'>['payload']) {
    try {
      this.logger.info('github webhook: push event received');

      // Skip if there are no commits (shouldn't happen, but checking anyway)
      if (!payload.commits || payload.commits.length === 0) {
        this.logger.info('Push event has no commits, skipping sync.');
        return;
      }

      // TODO: we should also check if the push was a result of a agentsmith PR being merged, and if so, we should not sync
      // we assume the repo is already synced from the PR being pushed to and we don't need to sync again
      // const isAgentsmithPr = payload.commits.some((commit) =>
      //   commit.message.toLowerCase().includes('agentsmith'),
      // );

      // if (isAgentsmithPr) {
      //   console.log('Push event from agentsmith PR, skipping sync.');
      //   return;
      // }

      // Ignore pushes made by our bot to prevent sync loops
      const pusher = payload.pusher;
      const isAgentsmithBot = pusher.name.includes('agentsmith') && pusher.name.includes('[bot]');
      if (isAgentsmithBot) {
        this.logger.info('Push event from agentsmith bot, ignoring to prevent sync loops.');
        return;
      }

      // Check if any commit message contains [skip sync]
      const shouldSkipSync = payload.commits.some((commit) =>
        commit.message.toLowerCase().includes('[skip sync]'),
      );

      if (shouldSkipSync) {
        this.logger.info('Push contains [skip sync] in commit message, skipping sync operation.');
        return;
      }

      const installationId = payload.installation?.id;
      if (!installationId) {
        this.logger.warn('Push event missing installation ID, cannot sync.');
        return;
      }

      const repositoryId = payload.repository.id;
      const pushedBranchRef = payload.ref; // e.g., "refs/heads/main"

      const projectRepo = await this.services.projects.getProjectRepositoryByInstallationId({
        repositoryId,
        installationId,
      });

      if (!projectRepo || !projectRepo.project_id) {
        this.logger.info(
          `No project found linked to repository ID ${repositoryId} and installation ID ${installationId}. Ignoring push.`,
        );
        return;
      }

      this.logger.info(
        `Push event detected for project ${projectRepo.project_id}, repository ${repositoryId}, ref ${pushedBranchRef}. Initiating sync from repository.`,
      );

      await this.services.githubSync.sync({
        projectRepository: projectRepo,
        source: 'repo',
        branchRef: pushedBranchRef,
      });

      this.logger.info(`Sync from repository completed for project ${projectRepo.project_id}`);
    } catch (e) {
      this.logger.error(e, 'push handler failed with error');
    }
  }
}
