import { createClient } from '@supabase/supabase-js';
import { Database } from '@/app/__generated__/supabase.types';
import { sha256Hash } from '@/utils/hash';
import { createSigner } from 'fast-jwt';

/**
 * Creates a Supabase JWT for a user based on the organization API key
 */
export function createSupabaseToken(userEmail: string, authUserId: string) {
  // JWT secret should match Supabase's JWT secret
  // This is typically accessed via environment variable
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('SUPABASE_JWT_SECRET environment variable must be set');
  }

  const signer = createSigner({
    key: jwtSecret,
    algorithm: 'HS256',
  });

  const ONE_HOUR = 60 * 60;
  const exp = Math.round(Date.now() / 1000) + ONE_HOUR;

  // Construct the JWT payload according to Supabase's expected format
  const payload = {
    aud: 'authenticated',
    exp,
    sub: authUserId,
    email: userEmail,
    role: 'authenticated',
  };

  return signer(payload);
}

type ApiKeyOrgResult = {
  organization_id: number;
  organization_uuid: string;
  user_id: number;
  auth_user_id: string;
  email: string;
};

export const exchangeApiKeyForJwt = async (apiKey: string) => {
  const apiKeyHash = sha256Hash(apiKey);

  const tempClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await tempClient.rpc(
    'get_organization_by_api_key_hash',
    {
      arg_api_key_hash: apiKeyHash,
    }
  );

  if (error) {
    console.error('Error getting organization by API key hash', error);
    throw new Error('Failed to get organization by API key hash');
  }

  if (!data) {
    throw new Error('No data returned from get_organization_by_api_key_hash');
  }

  const result = data as ApiKeyOrgResult;

  return createSupabaseToken(result.email, result.auth_user_id);
};

export const createJwtClient = async (jwt: string) => {
  if (!jwt) {
    throw new Error('JWT is required');
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      },
    }
  );
};
