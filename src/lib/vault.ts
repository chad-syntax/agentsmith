import { ORGANIZATION_KEYS } from '@/app/constants';
import { createClient } from './supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/app/__generated__/supabase.types';

// Return type definitions
type GetSecretResult = {
  data: string | null;
  error?: string;
};

type OrganizationKeyOperationResult = {
  success: boolean;
  vaultSecretId?: string;
  error?: string;
};

type DeleteOrganizationKeyResult = {
  success: boolean;
  error?: string;
};

type GetOrganizationKeyResult = {
  value: string | null;
  error?: string;
};

type GetOrCreateOpenrouterCodeVerifierResult = {
  success: boolean;
  codeVerifier?: string;
  error?: string;
};

// Options type definitions
type CreateOrganizationKeyOptions = {
  organizationUuid: string;
  key: string;
  value: string;
  description?: string;
};

type ReplaceOrganizationKeyOptions = {
  organizationUuid: string;
  key: string;
  value: string;
  description?: string;
};

/**
 * Vault service for securely storing and retrieving organization keys
 */
export class VaultService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Gets a secret from the vault by its ID
   */
  async getSecret(vaultSecretId: string): Promise<GetSecretResult> {
    try {
      const { data, error } = await this.supabase.rpc(
        'get_organization_vault_secret',
        {
          arg_vault_secret_id: vaultSecretId,
        }
      );

      if (error) {
        console.error('Error getting secret from vault:', error);
        return {
          data: null,
          error: error.message || 'Failed to get secret from vault',
        };
      }

      return { data: (data as any)?.value || null };
    } catch (error) {
      console.error('Unexpected error getting secret from vault:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Creates a new organization key
   */
  async createOrganizationKey(
    options: CreateOrganizationKeyOptions
  ): Promise<OrganizationKeyOperationResult> {
    try {
      const { organizationUuid, key, value, description } = options;

      const { data, error } = await this.supabase.rpc(
        'create_organization_key',
        {
          arg_organization_uuid: organizationUuid,
          arg_key: key,
          arg_value: value,
          arg_description: description,
        }
      );

      if (error) {
        console.error('Error creating organization key:', error);
        return {
          success: false,
          error: error.message || 'Failed to create organization key',
        };
      }

      return {
        success: true,
        vaultSecretId: (data as any)?.vault_secret_id,
      };
    } catch (error) {
      console.error('Unexpected error creating organization key:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Deletes an organization key if it exists
   */
  async deleteOrganizationKey(
    organizationUuid: string,
    key: string
  ): Promise<DeleteOrganizationKeyResult> {
    try {
      const { data, error } = await this.supabase.rpc(
        'delete_organization_key',
        {
          arg_organization_uuid: organizationUuid,
          arg_key_name: key,
        }
      );

      if (error) {
        console.error('Error deleting organization key:', error);
        return {
          success: false,
          error: error.message || 'Failed to delete organization key',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Unexpected error deleting organization key:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Replace an organization key (delete and create)
   * This is a convenience method that deletes a key if it exists and then creates a new one
   */
  async replaceOrganizationKey(
    options: ReplaceOrganizationKeyOptions
  ): Promise<OrganizationKeyOperationResult> {
    try {
      const { organizationUuid, key, value, description } = options;

      // Delete the key if it exists (ignore result)
      await this.deleteOrganizationKey(organizationUuid, key);

      // Create a new key
      return await this.createOrganizationKey({
        organizationUuid,
        key,
        value,
        description,
      });
    } catch (error) {
      console.error('Unexpected error replacing organization key:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Gets an organization key's secret by its name
   */
  async getOrganizationKeySecret(
    organizationUuid: string,
    key: string
  ): Promise<GetOrganizationKeyResult> {
    try {
      // Find the organization key
      const { data, error } = await this.supabase
        .from('organizations')
        .select('organization_keys!inner(key, vault_secret_id)')
        .eq('uuid', organizationUuid)
        .eq('organization_keys.key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found error
          return { value: null };
        }
        return {
          value: null,
          error: error.message || 'Failed to get organization key',
        };
      }

      if (
        !data ||
        !data.organization_keys ||
        data.organization_keys.length === 0
      ) {
        return { value: null };
      }

      const vaultSecretId = data.organization_keys[0].vault_secret_id;

      // Get the secret from the vault
      const { data: secretData, error: secretError } =
        await this.getSecret(vaultSecretId);

      if (secretError) {
        return { value: null, error: secretError };
      }

      return { value: secretData };
    } catch (error) {
      console.error('Unexpected error getting organization key:', error);
      return {
        value: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

/**
 * Create a vault service instance
 */
export const createVaultService = async (): Promise<VaultService> => {
  const supabase = await createClient();
  return new VaultService(supabase);
};

// Helper for OpenRouter integration
const generateRandomString = (length: number): string => {
  const chars =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Gets or creates an OpenRouter code verifier for an organization
 */
export const getOrCreateOpenrouterCodeVerifier = async (
  organizationUuid: string
): Promise<GetOrCreateOpenrouterCodeVerifierResult> => {
  const vaultService = await createVaultService();

  // Try to get existing code verifier
  const { value, error } = await vaultService.getOrganizationKeySecret(
    organizationUuid,
    ORGANIZATION_KEYS.OPENROUTER_CODE_VERIFIER
  );

  console.log(
    'existing code verifier for organization',
    organizationUuid,
    value
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
  const newCodeVerifier = generateRandomString(32);

  const { success, error: createError } =
    await vaultService.createOrganizationKey({
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
};
