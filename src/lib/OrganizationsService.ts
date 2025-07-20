import {
  AgentsmithSupabaseService,
  AgentsmithSupabaseServiceConstructorOptions,
} from './AgentsmithSupabaseService';
import { AgentsmithServicesDirectory } from './AgentsmithServices';
import { genAlphaNumeric } from '@/utils/gen-alpha-numeric';
import { ORGANIZATION_KEYS } from '@/app/constants';

// type GetOrCreateOpenrouterCodeVerifierResult = {
//   success: boolean;
//   codeVerifier?: string;
//   error?: string;
// };

type GetOrCreateOpenrouterCodeVerifierResult =
  | {
      success: true;
      codeVerifier: string;
    }
  | {
      success: false;
      error: string;
    };

export class OrganizationsService extends AgentsmithSupabaseService {
  public services!: AgentsmithServicesDirectory;

  constructor(options: AgentsmithSupabaseServiceConstructorOptions) {
    super({ ...options, serviceName: 'organizations' });
  }

  public async getOrganizationId(organizationUuid: string) {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('id')
      .eq('uuid', organizationUuid)
      .single();

    if (error) {
      this.logger.error(error, 'Error fetching organization id');
      return null;
    }

    return data.id;
  }

  public async getOrganizationData(organizationUuid: string) {
    const { data, error } = await this.supabase
      .from('organizations')
      .select(
        '*, agentsmith_tiers(*), projects(*), organization_users(id, role, agentsmith_users(*))',
      )
      .eq('uuid', organizationUuid)
      .single();

    if (error) {
      this.logger.error(error, 'Error fetching organization data');
      return null;
    }

    return data;
  }

  public async getOrganizationTierData(organizationUuid: string) {
    const { data, error } = await this.supabase
      .from('agentsmith_tiers')
      .select('*, organizations!inner(uuid)')
      .eq('organizations.uuid', organizationUuid)
      .single();

    if (error) {
      this.logger.error(error, 'Error fetching organization tier data');
      return null;
    }

    return data;
  }

  public async getProjectRepositoriesForOrganization(organizationId: number) {
    const { data, error } = await this.supabase
      .from('project_repositories')
      .select(
        '*, github_app_installations!inner(status), organizations!inner(id), projects(uuid, name)',
      )
      .eq('github_app_installations.status', 'ACTIVE')
      .eq('organizations.id', organizationId);

    if (error) {
      this.logger.error(error, 'Failed to fetch project repositories for organization');
      throw error;
    }

    return data;
  }

  public async getOrganizationKeySecret(organizationUuid: string, key: string) {
    const response = await this.services.vault.getOrganizationKeySecret(organizationUuid, key);

    if (response.error) {
      this.logger.error(response.error, 'Error fetching organization key secret');
      return response;
    }

    return response;
  }

  async getOrCreateOpenrouterCodeVerifier(
    organizationUuid: string,
  ): Promise<GetOrCreateOpenrouterCodeVerifierResult> {
    // Try to get existing code verifier
    const { value, error } = await this.services.vault.getOrganizationKeySecret(
      organizationUuid,
      ORGANIZATION_KEYS.OPENROUTER_CODE_VERIFIER,
    );

    if (error) {
      this.logger.error(error, 'Error getting OpenRouter code verifier:');
      return {
        success: false,
        error: `Failed to get OpenRouter code verifier: ${error}`,
      };
    }

    // If code verifier exists, return it
    if (value) {
      return {
        success: true,
        codeVerifier: value,
      };
    }

    // Generate and store a new code verifier
    const newCodeVerifier = genAlphaNumeric(32);

    const { success, error: createError } = await this.services.vault.createOrganizationKey({
      organizationUuid,
      key: ORGANIZATION_KEYS.OPENROUTER_CODE_VERIFIER,
      value: newCodeVerifier,
      description: 'OpenRouter code verifier',
    });

    if (!success) {
      this.logger.error(createError, 'Error creating OpenRouter code verifier:');
      return {
        success: false,
        error: `Failed to create OpenRouter code verifier: ${createError}`,
      };
    }

    return {
      success: true,
      codeVerifier: newCodeVerifier,
    };
  }

  async isUnderUserLimit(organizationId: number) {
    const { data, error } = await this.supabase.rpc('is_under_user_limit', {
      arg_organization_id: organizationId,
    });

    if (error) {
      this.logger.error(error, 'Error checking user limit:');
      throw new Error('Error checking user limit');
    }

    return data;
  }

  async isUnderProjectLimit(organizationId: number) {
    const { data, error } = await this.supabase.rpc('is_under_project_limit', {
      arg_organization_id: organizationId,
    });

    if (error) {
      this.logger.error(error, 'Error checking project limit:');
      throw new Error('Error checking project limit');
    }

    return data;
  }
}

export type GetOrganizationDataResult = Awaited<
  ReturnType<typeof OrganizationsService.prototype.getOrganizationData>
>;

export type GetProjectRepositoriesForOrganizationResult = Awaited<
  ReturnType<typeof OrganizationsService.prototype.getProjectRepositoriesForOrganization>
>;

export type GetOrganizationTierDataResult = Awaited<
  ReturnType<typeof OrganizationsService.prototype.getOrganizationTierData>
>;
