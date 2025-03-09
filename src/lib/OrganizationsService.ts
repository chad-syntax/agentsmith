import {
  AgentsmithSupabaseService,
  AgentsmithSupabaseServiceConstructorOptions,
} from './AgentsmithSupabaseService';
import { AgentsmithServicesDirectory } from './AgentsmithServices';
import { genAlphaNumeric } from '@/utils/gen-alpha-numeric';
import { ORGANIZATION_KEYS } from '@/app/constants';

type GetOrCreateOpenrouterCodeVerifierResult = {
  success: boolean;
  codeVerifier?: string;
  error?: string;
};

export class OrganizationsService extends AgentsmithSupabaseService {
  public services!: AgentsmithServicesDirectory;

  constructor(options: AgentsmithSupabaseServiceConstructorOptions) {
    super({ ...options, serviceName: 'organizations' });
  }

  public async getOrganizationData(organizationUuid: string) {
    const { data, error } = await this.supabase
      .from('organizations')
      .select(
        '*, projects(*), organization_users(id, role, agentsmith_users(*))'
      )
      .eq('uuid', organizationUuid)
      .single();

    if (error) {
      console.error('Error fetching organization data', error);
      return null;
    }

    return data;
  }

  public async getOrganizationKeySecret(organizationUuid: string, key: string) {
    const response = await this.services.vault.getOrganizationKeySecret(
      organizationUuid,
      key
    );

    if (response.error) {
      console.error('Error fetching organization key secret', response.error);
      return response;
    }

    return response;
  }

  async getOrCreateOpenrouterCodeVerifier(
    organizationUuid: string
  ): Promise<GetOrCreateOpenrouterCodeVerifierResult> {
    // Try to get existing code verifier
    const { value, error } = await this.services.vault.getOrganizationKeySecret(
      organizationUuid,
      ORGANIZATION_KEYS.OPENROUTER_CODE_VERIFIER
    );

    if (error) {
      console.error('Error getting OpenRouter code verifier:', error);
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

    const { success, error: createError } =
      await this.services.vault.createOrganizationKey({
        organizationUuid,
        key: ORGANIZATION_KEYS.OPENROUTER_CODE_VERIFIER,
        value: newCodeVerifier,
        description: 'OpenRouter code verifier',
      });

    if (!success) {
      console.error('Error creating OpenRouter code verifier:', createError);
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
}

export type GetOrganizationDataResult = Awaited<
  ReturnType<typeof OrganizationsService.prototype.getOrganizationData>
>;
