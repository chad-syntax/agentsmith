import { Database } from '@/app/__generated__/supabase.types';
import type { User, SupabaseClient } from '@supabase/supabase-js';
import { AgentsmithSupabaseService } from './AgentsmithSupabaseService';
import { AgentsmithServicesDirectory } from './AgentsmithServices';

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
        console.warn('No user found, failed to initialize UsersService');
        return {
          authUser: null,
          agentsmithUser: null,
        };
      }

      this.authUser = user;
    }

    this.agentsmithUser = await this.getAgentsmithUser(this.authUser.id);

    this.initialized = true;

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
      console.error('Error fetching user', error);
      return null;
    }

    if (!data) {
      console.warn('No user found, failed to fetch user', authUserId);
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
            uuid,
            name, 
            organization_keys (
              id,
              key
            ),
            projects (
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
}

export type GetUserOrganizationDataResult = Awaited<
  ReturnType<typeof UsersService.prototype.getUserOrganizationData>
>;
