'use server';

import { redirect } from 'next/navigation';
import crypto from 'crypto';

// read more: https://openrouter.ai/docs/use-cases/oauth-pkce
export const connectOpenrouter = async () => {
  async function sha256CodeChallenge(input: string) {
    return crypto.createHash('sha256').update(input).digest('base64url');
  }

  const code_verifier = process.env.OPENROUTER_CODE_VERIFIER;

  if (!code_verifier) {
    console.error(
      'OPENROUTER_CODE_VERIFIER is not set! Cannot connect user to openrouter'
    );
    return;
  }

  const generatedCodeChallenge = await sha256CodeChallenge(code_verifier);

  const redirectUrl = `https://openrouter.ai/auth?callback_url=${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000/connect/openrouter'}&code_challenge=${generatedCodeChallenge}&code_challenge_method=S256`;

  return redirect(redirectUrl);
};
