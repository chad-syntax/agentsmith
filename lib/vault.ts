import { USER_KEYS } from '@/app/constants';
import { createClient } from './supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

// Return type definitions
type GetSecretResult = {
  data: string | null;
  error?: string;
};

type UserKeyOperationResult = {
  success: boolean;
  vaultSecretId?: string;
  error?: string;
};

type DeleteUserKeyResult = {
  success: boolean;
  error?: string;
};

type GetUserKeyResult = {
  value: string | null;
  error?: string;
};

type GetOrCreateOpenrouterCodeVerifierResult = {
  success: boolean;
  codeVerifier?: string;
  error?: string;
};

// Options type definitions
type CreateUserKeyOptions = {
  key: string;
  value: string;
  description?: string;
};

type ReplaceUserKeyOptions = {
  key: string;
  value: string;
  description?: string;
};

/**
 * Vault service for securely storing and retrieving user keys
 */
export class VaultService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Gets a secret from the vault by its ID
   */
  async getSecret(vaultSecretId: string): Promise<GetSecretResult> {
    try {
      const { data, error } = await this.supabase.rpc('get_vault_secret', {
        arg_vault_secret_id: vaultSecretId,
      });

      if (error) {
        console.error('Error getting secret from vault:', error);
        return {
          data: null,
          error: error.message || 'Failed to get secret from vault',
        };
      }

      return { data: data?.value || null };
    } catch (error) {
      console.error('Unexpected error getting secret from vault:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Creates a new user key
   */
  async createUserKey(
    options: CreateUserKeyOptions
  ): Promise<UserKeyOperationResult> {
    try {
      const { key, value, description } = options;

      const { data, error } = await this.supabase.rpc('create_user_key', {
        arg_key: key,
        arg_value: value,
        arg_description: description,
      });

      if (error) {
        console.error('Error creating user key:', error);
        return {
          success: false,
          error: error.message || 'Failed to create user key',
        };
      }

      return {
        success: true,
        vaultSecretId: data?.vault_secret_id,
      };
    } catch (error) {
      console.error('Unexpected error creating user key:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Deletes a user key if it exists
   */
  async deleteUserKey(key: string): Promise<DeleteUserKeyResult> {
    try {
      const { data, error } = await this.supabase.rpc('delete_user_key', {
        arg_key_name: key,
      });

      if (error) {
        console.error('Error deleting user key:', error);
        return {
          success: false,
          error: error.message || 'Failed to delete user key',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Unexpected error deleting user key:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Replace a user key (delete and create)
   * This is a convenience method that deletes a key if it exists and then creates a new one
   */
  async replaceUserKey(
    options: ReplaceUserKeyOptions
  ): Promise<UserKeyOperationResult> {
    try {
      const { key, value, description } = options;

      // Delete the key if it exists (ignore result)
      await this.deleteUserKey(key);

      // Create a new key
      return await this.createUserKey({ key, value, description });
    } catch (error) {
      console.error('Unexpected error replacing user key:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Gets a user key's secret by its name
   */
  async getUserKeySecret(key: string): Promise<GetUserKeyResult> {
    try {
      const { data: userData, error: userError } =
        await this.supabase.auth.getUser();

      if (userError || !userData.user) {
        return {
          value: null,
          error: userError?.message || 'No authenticated user found',
        };
      }

      // Find the user key
      const { data, error } = await this.supabase
        .from('agentsmith_users')
        .select('user_keys!inner(key, vault_secret_id)')
        .eq('auth_user_id', userData.user.id)
        .eq('user_keys.key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found error
          return { value: null };
        }
        return {
          value: null,
          error: error.message || 'Failed to get user key',
        };
      }

      if (!data || !data.user_keys || data.user_keys.length === 0) {
        return { value: null };
      }

      const vaultSecretId = data.user_keys[0].vault_secret_id;

      // Get the secret from the vault
      const { data: secretData, error: secretError } =
        await this.getSecret(vaultSecretId);

      if (secretError) {
        return { value: null, error: secretError };
      }

      return { value: secretData };
    } catch (error) {
      console.error('Unexpected error getting user key:', error);
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
 * Gets or creates an OpenRouter code verifier
 */
export const getOrCreateOpenrouterCodeVerifier =
  async (): Promise<GetOrCreateOpenrouterCodeVerifierResult> => {
    const vaultService = await createVaultService();

    // Try to get existing code verifier
    const { value, error } = await vaultService.getUserKeySecret(
      USER_KEYS.OPENROUTER_CODE_VERIFIER
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

    const { success, error: createError } = await vaultService.createUserKey({
      key: USER_KEYS.OPENROUTER_CODE_VERIFIER,
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
