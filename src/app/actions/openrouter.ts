'use server';

import { redirect } from 'next/navigation';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { routes } from '@/utils/routes';

const sha256CodeChallenge = async (input: string) =>
  crypto.createHash('sha256').update(input).digest('base64url');

// read more: https://openrouter.ai/docs/use-cases/oauth-pkce
export const connectOpenrouter = async (organizationUuid: string) => {
  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  const codeVerifierResponse =
    await agentsmith.services.organizations.getOrCreateOpenrouterCodeVerifier(organizationUuid);

  if (!codeVerifierResponse.success) {
    return codeVerifierResponse;
  }

  const generatedCodeChallenge = await sha256CodeChallenge(codeVerifierResponse.codeVerifier);

  const callbackUrl = encodeURIComponent(
    `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/openrouter/callback/${organizationUuid}`,
  );

  const redirectUrl = `${routes.openrouter.oauthInitiate}?callback_url=${callbackUrl}&code_challenge=${generatedCodeChallenge}&code_challenge_method=S256`;

  redirect(redirectUrl);
};
