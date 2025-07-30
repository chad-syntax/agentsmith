import { Database } from '@/app/__generated__/supabase.types';
import {
  AgentsmithSupabaseService,
  AgentsmithSupabaseServiceConstructorOptions,
} from './AgentsmithSupabaseService';
import { EmitterWebhookEvent } from '@octokit/webhooks';

type ProjectRepositoryInsert = Database['public']['Tables']['project_repositories']['Insert'];

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
      const { data: installationRecord, error } = await this.supabase
        .from('github_app_installations')
        .update({ status: 'DELETED' })
        .eq('installation_id', payload.installation.id)
        .select('id')
        .single();

      if (error) {
        this.logger.error(error, 'Failed to update installation status to DELETED:');
        throw error;
      }

      if (!installationRecord) {
        this.logger.error(
          `No installation record found for installation ID ${payload.installation.id}, cannot disconnect project repositories`,
        );
        return;
      }

      // disconnect all project repositories from the installation so they may be re-connected with a new installation
      const { error: disconnectError } = await this.supabase
        .from('project_repositories')
        .update({ project_id: null })
        .eq('github_app_installation_id', installationRecord.id);

      if (disconnectError) {
        this.logger.error(disconnectError, 'Failed to disconnect project repositories:');
        throw disconnectError;
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

      const installationId = installation.id;

      if (repositories_added.length === 0) {
        this.logger.warn(
          `No repositories added in installation_repositories.added event for installation ID ${installationId}, skipping.`,
        );
        return;
      }

      const { data: installationRecord, error: getInstallationError } = await this.supabase
        .from('github_app_installations')
        .select('id, organizations(id)')
        .eq('installation_id', installationId)
        .single();

      if (getInstallationError) {
        this.logger.error(getInstallationError, 'Failed to get installation record:');
        throw getInstallationError;
      }

      if (!installationRecord) {
        const msg = `No installation record found for installation ID ${installationId}`;
        this.logger.error(msg);
        throw new Error(msg);
      }

      const allRepos = await this.services.githubApp.getInstallationRepositories(installationId);

      const newRecords = repositories_added.reduce<ProjectRepositoryInsert[]>((acc, repo) => {
        const fullRepoData = allRepos.find((r) => r.id === repo.id);
        if (!fullRepoData) {
          this.logger.warn(`No full repository data found for repository ID ${repo.id}, skipping.`);
          return acc;
        }
        return [
          ...acc,
          {
            github_app_installation_id: installationRecord.id,
            organization_id: installationRecord.organizations.id,
            repository_id: repo.id,
            repository_name: repo.name,
            repository_full_name: repo.full_name,
            repository_default_branch: fullRepoData.default_branch,
          },
        ];
      }, []);

      const { error } = await this.supabase.from('project_repositories').upsert(newRecords, {
        onConflict: 'repository_id, github_app_installation_id',
        ignoreDuplicates: true,
      });

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
      const { repositories_removed, installation } = payload;
      if (repositories_removed.length === 0) return;

      const { data: installationRecord, error: getInstallationError } = await this.supabase
        .from('github_app_installations')
        .select('id')
        .eq('installation_id', installation.id)
        .single();

      if (getInstallationError) {
        this.logger.error(getInstallationError, 'Failed to get installation record:');
        throw getInstallationError;
      }

      if (!installationRecord) {
        this.logger.error(
          `No installation record found for installation ID ${installation.id}, cannot delete project repositories`,
        );
        return;
      }

      const recordIdsToDelete = repositories_removed.map((repo) => repo.id);

      // Only remove project_repository records that are part of the installation as well
      const { error } = await this.supabase
        .from('project_repositories')
        .delete()
        .in('repository_id', recordIdsToDelete)
        .eq('github_app_installation_id', installationRecord.id);

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

      // Ignore pushes made by our bot to prevent sync loops
      const pusher = payload.pusher;
      const isAgentsmithBot = pusher.name.includes('agentsmith') && pusher.name.includes('[bot]');
      if (isAgentsmithBot) {
        this.logger.info(
          `Push event from agentsmith bot ${pusher.name}, ignoring to prevent sync loops. Pushed branch ref: ${payload.ref}, repository id: ${payload.repository.id}`,
        );
        return;
      }

      // Check if any commit message contains [skip sync]
      const shouldSkipSync = payload.commits.some((commit) =>
        commit.message.toLowerCase().includes('[skip sync]'),
      );

      if (shouldSkipSync) {
        this.logger.info(
          `Push contains [skip sync] in commit message, skipping sync operation. Pushed branch ref: ${payload.ref}, repository id: ${payload.repository.id}`,
        );
        return;
      }

      const installationId = payload.installation?.id;
      if (!installationId) {
        this.logger.warn(
          `Push event missing installation ID, cannot sync. Pushed branch ref: ${payload.ref}, repository id: ${payload.repository.id}`,
        );
        return;
      }

      const repositoryId = payload.repository.id;
      const pushedBranchRef = payload.ref; // e.g., "refs/heads/main"
      const defaultBranch = payload.repository.default_branch;
      const isMainBranch = pushedBranchRef === `refs/heads/${defaultBranch}`;

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
        isMainBranch,
      });

      this.logger.info(`Sync from repository completed for project ${projectRepo.project_id}`);
    } catch (e) {
      this.logger.error(e, 'push handler failed with error');
    }
  }
}
