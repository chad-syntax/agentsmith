'use server';

import { redirect } from 'next/navigation';
import crypto from 'crypto';
import { getOrCreateOpenrouterCodeVerifier } from '~/lib/vault';

const sha256CodeChallenge = async (input: string) =>
  crypto.createHash('sha256').update(input).digest('base64url');

// read more: https://openrouter.ai/docs/use-cases/oauth-pkce
export const connectOpenrouter = async () => {
  const codeVerifierResponse = await getOrCreateOpenrouterCodeVerifier();

  if (!codeVerifierResponse.success) {
    return codeVerifierResponse;
  }

  const generatedCodeChallenge = await sha256CodeChallenge(
    codeVerifierResponse.codeVerifier!
  );

  // Save the code verifier to the environment variable for the callback
  process.env.OPENROUTER_CODE_VERIFIER = codeVerifierResponse.codeVerifier;

  const redirectUrl = `https://openrouter.ai/auth?callback_url=${
    process.env.NEXT_PUBLIC_URL || 'http://localhost:3000/connect/openrouter'
  }&code_challenge=${generatedCodeChallenge}&code_challenge_method=S256`;

  return redirect(redirectUrl);
};
