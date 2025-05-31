import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/app/__generated__/supabase.types';
import { sha256Hash } from '@/utils/hash';
import { createSigner } from 'fast-jwt';
import { logger } from '../logger';

config();

type CreateSupabaseTokenOptions = {
  userEmail: string;
  authUserId: string;
  role?: string;
};

/**
 * Creates a Supabase JWT for a user based on the organization API key
 */
export function createSupabaseToken(options: CreateSupabaseTokenOptions) {
  const { userEmail, authUserId, role = 'authenticated' } = options;

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
    role,
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

export const exchangeApiKeyForJwt = async (
  apiKey: string,
  supabaseUrl?: string,
  supabaseAnonKey?: string,
) => {
  const apiKeyHash = sha256Hash(apiKey);

  const tempClient = createClient<Database>(
    supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await tempClient.rpc('get_organization_by_api_key_hash', {
    arg_api_key_hash: apiKeyHash,
  });

  if (error) {
    logger.error('Error getting organization by API key hash', error);
    throw new Error('Failed to get organization by API key hash');
  }

  if (!data) {
    throw new Error('No data returned from get_organization_by_api_key_hash');
  }

  const result = data as ApiKeyOrgResult;

  const jwt = createSupabaseToken({ userEmail: result.email, authUserId: result.auth_user_id });

  return jwt;
};

export const getGithubWebhookUserJwt = () => {
  const GITHUB_WEBHOOK_SERVICE_USER_ID = process.env.GITHUB_WEBHOOK_SERVICE_USER_ID;
  if (!GITHUB_WEBHOOK_SERVICE_USER_ID) {
    throw new Error('GITHUB_WEBHOOK_SERVICE_USER_ID is not defined');
  }

  const jwt = createSupabaseToken({
    userEmail: 'github_webhook@agentsmith.app',
    authUserId: GITHUB_WEBHOOK_SERVICE_USER_ID,
    role: 'github_webhook',
  });

  return jwt;
};

export const createJwtClient = (jwt: string) => {
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
    },
  );
};
