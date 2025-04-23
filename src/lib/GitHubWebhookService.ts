import {
  AgentsmithSupabaseService,
  AgentsmithSupabaseServiceConstructorOptions,
} from './AgentsmithSupabaseService';
import { EmitterWebhookEvent } from '@octokit/webhooks/dist-types/types';

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
        console.log('github webhook: pull request opened', payload);
      } catch (e) {
        console.error(`pull_request.opened handler failed with error: ${(<Error>e).message}`);
      }
    });

    app.webhooks.on('pull_request.edited', async ({ payload }) => {
      try {
        // Do something else
        console.log('github webhook: pull request edited', payload);
      } catch (e) {
        console.error(`pull_request.edited handler failed with error: ${(<Error>e).message}`);
      }
    });

    app.webhooks.on('push', async ({ payload }) => {
      try {
        // Do something else
        console.log('github webhook: push', payload);
      } catch (e) {
        console.error(`push handler failed with error: ${(<Error>e).message}`);
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
}
