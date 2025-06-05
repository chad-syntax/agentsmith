import { Database } from '@/app/__generated__/supabase.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AgentsmithSupabaseService } from './AgentsmithSupabaseService';
import { AgentsmithServicesDirectory } from './AgentsmithServices';

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

type VaultServiceConstructorOptions = {
  supabase: SupabaseClient<Database>;
};

export class VaultService extends AgentsmithSupabaseService {
  public services!: AgentsmithServicesDirectory;

  constructor(options: VaultServiceConstructorOptions) {
    super({ ...options, serviceName: 'vault' });
  }

  /**
   * Gets a secret from the vault by its ID
   */
  async getSecret(vaultSecretId: string): Promise<GetSecretResult> {
    try {
      const { data, error } = await this.supabase.rpc('get_organization_vault_secret', {
        arg_vault_secret_id: vaultSecretId,
      });

      if (error) {
        this.logger.error(error, 'Error getting secret from vault:');
        return {
          data: null,
          error: error.message || 'Failed to get secret from vault',
        };
      }

      return { data: (data as any)?.value || null };
    } catch (error) {
      this.logger.error(error, 'Unexpected error getting secret from vault:');
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
    options: CreateOrganizationKeyOptions,
  ): Promise<OrganizationKeyOperationResult> {
    try {
      const { organizationUuid, key, value, description } = options;

      const { data, error } = await this.supabase.rpc('create_organization_key', {
        arg_organization_uuid: organizationUuid,
        arg_key: key,
        arg_value: value,
        arg_description: description,
      });

      if (error) {
        this.logger.error(error, 'Error creating organization key');
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
      this.logger.error(error, 'Unexpected error creating organization key:');
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
    key: string,
  ): Promise<DeleteOrganizationKeyResult> {
    try {
      const { data, error } = await this.supabase.rpc('delete_organization_key', {
        arg_organization_uuid: organizationUuid,
        arg_key_name: key,
      });

      if (error) {
        this.logger.error(error, 'Error deleting organization key:');
        return {
          success: false,
          error: error.message || 'Failed to delete organization key',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error(error, 'Unexpected error deleting organization key:');
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
    options: ReplaceOrganizationKeyOptions,
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
      this.logger.error(error, 'Unexpected error replacing organization key:');
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
    key: string,
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

      if (!data || !data.organization_keys || data.organization_keys.length === 0) {
        return { value: null };
      }

      const vaultSecretId = data.organization_keys[0].vault_secret_id;

      // Get the secret from the vault
      const { data: secretData, error: secretError } = await this.getSecret(vaultSecretId);

      if (secretError) {
        return { value: null, error: secretError };
      }

      return { value: secretData };
    } catch (error) {
      this.logger.error(error, 'Unexpected error getting organization key:');
      return {
        value: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
