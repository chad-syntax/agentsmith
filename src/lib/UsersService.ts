import { Database } from '@/app/__generated__/supabase.types';
import type { User, SupabaseClient } from '@supabase/supabase-js';
import { AgentsmithSupabaseService } from './AgentsmithSupabaseService';
import { AgentsmithServicesDirectory } from './AgentsmithServices';
import { logger } from './logger';

type AgentsmithUser = Database['public']['Tables']['agentsmith_users']['Row'];

type UsersServiceConstructorOptions = {
  supabase: SupabaseClient<Database>;
};

export class UsersService extends AgentsmithSupabaseService {
  public authUser: User | null;
  public agentsmithUser: AgentsmithUser | null;
  public initialized = false;
  public services!: AgentsmithServicesDirectory;

  constructor(options: UsersServiceConstructorOptions) {
    super({
      ...options,
      serviceName: 'users',
    });

    this.authUser = null;
    this.agentsmithUser = null;
  }

  public async initialize() {
    if (!this.authUser) {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        this.logger.warn('No user found, failed to initialize UsersService');
        return {
          authUser: null,
          agentsmithUser: null,
        };
      }

      this.authUser = user;
    }

    this.agentsmithUser = await this.getAgentsmithUser(this.authUser.id);

    this.initialized = true;

    // not sure if this is the best place for this, but we need to set these bindings to match logs to users somewhere
    if (logger.setBindings && typeof logger.setBindings === 'function') {
      logger.setBindings({
        authUserId: this.authUser.id,
        agentsmithUserId: this.agentsmithUser?.id,
      });
    }

    return {
      authUser: this.authUser,
      agentsmithUser: this.agentsmithUser,
    };
  }

  public async getAuthUser() {
    if (!this.authUser) {
      await this.initialize();
    }

    return { authUser: this.authUser };
  }

  async getAgentsmithUser(authUserId: string, refetch = false) {
    if (this.agentsmithUser && !refetch) {
      return this.agentsmithUser;
    }

    const { data, error } = await this.supabase
      .from('agentsmith_users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (error) {
      this.logger.error(error, 'Error fetching user');
      return null;
    }

    if (!data) {
      this.logger.warn('No user found, failed to fetch user', authUserId);
      return null;
    }

    return data;
  }

  async getUserOrganizationData() {
    if (!this.agentsmithUser) {
      await this.initialize();

      if (!this.agentsmithUser) {
        throw new Error('User not found, cannot fetch organization data');
      }
    }

    const { data, error } = await this.supabase
      .from('agentsmith_users')
      .select(
        ` 
        organization_users (
          id,
          role, 
          organizations (
            id,
            uuid,
            name, 
            github_app_installations(
              status
            ),
            organization_keys (
              id,
              key
            ),
            agentsmith_tiers (
              tier,
              name,
              prompt_limit,
              user_limit,
              project_limit,
              llm_logs_limit,
              metrics_page_access
            ),
            projects (
              id,
              uuid,
              name
            )
          )
        )`,
      )
      .eq('id', this.agentsmithUser.id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Fetches the onboarding checklist status for each organization the user is an admin of.
   * For each organization, checks:
   * - If GitHub App is installed
   * - If a repository is connected
   * - If OpenRouter API key is configured
   * - If at least one prompt exists
   * - If at least one prompt has been tested (via LLM logs)
   * - If repository sync has been completed
   */
  async getOnboardingChecklist() {
    const userOrganizationData = await this.getUserOrganizationData();

    const data = await Promise.all(
      userOrganizationData.organization_users.map(async (orgUser) => {
        if (orgUser.role !== 'ADMIN') {
          return null;
        }

        const { data, error } = await this.supabase
          .from('organizations')
          .select(
            'name, projects(prompts(id), llm_logs(id), agentsmith_events(id, type, created_at)), github_app_installations(status, project_repositories(id, project_id)), organization_keys(id, key)',
          )
          .eq('uuid', orgUser.organizations.uuid)
          .eq('projects.agentsmith_events.type', 'SYNC_COMPLETE')
          .eq('github_app_installations.status', 'ACTIVE')
          .limit(1, { referencedTable: 'projects' })
          .limit(1, { referencedTable: 'projects.llm_logs' })
          .limit(1, { referencedTable: 'projects.agentsmith_events' })
          .limit(1, { referencedTable: 'projects.prompts' })
          .single();

        if (error) {
          this.logger.error(error, 'Error fetching onboarding checklist data');
          return null;
        }

        const { projects, github_app_installations, organization_keys } = data;

        const appInstalled = github_app_installations.some(
          (installation) => installation.status === 'ACTIVE',
        );

        const repoConnected = github_app_installations.some((installation) =>
          installation.project_repositories.some((repo) => repo.project_id !== null),
        );

        const openrouterConnected = organization_keys.some(
          (key) => key.key === 'OPENROUTER_API_KEY',
        );

        const repoSynced = projects?.[0]?.agentsmith_events?.length > 0;

        const promptCreated = projects?.[0]?.prompts?.length > 0;
        const promptTested = projects?.[0]?.llm_logs?.length > 0;

        return {
          organizationUuid: orgUser.organizations.uuid,
          appInstalled,
          repoConnected,
          openrouterConnected,
          promptCreated,
          promptTested,
          repoSynced,
        };
      }),
    );

    return data;
  }
}

export type GetUserOrganizationDataResult = Awaited<
  ReturnType<typeof UsersService.prototype.getUserOrganizationData>
>;

export type GetOnboardingChecklistResult = ({
  organizationUuid: string;
  appInstalled: boolean;
  repoConnected: boolean;
  openrouterConnected: boolean;
  promptCreated: boolean;
  promptTested: boolean;
  repoSynced: boolean;
} | null)[];
