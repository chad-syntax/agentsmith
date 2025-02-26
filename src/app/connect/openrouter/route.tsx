import { NextResponse } from 'next/server';
import { USER_KEYS } from '../../constants';
import { createVaultService } from '~/lib/vault';
import { createClient } from '~/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    console.error('/connect/openrouter: no code found');
    return NextResponse.redirect(
      new URL('/app/account?message=Failed to connect OpenRouter', request.url)
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error('/connect/openrouter: no user found');
    return NextResponse.redirect(
      new URL('/app/account?message=Failed to connect OpenRouter', request.url)
    );
  }

  // Get the code verifier from the user's vault instead of environment variable
  const vaultService = await createVaultService();
  const { value: codeVerifier, error: codeVerifierError } =
    await vaultService.getUserKeySecret(USER_KEYS.OPENROUTER_CODE_VERIFIER);

  if (codeVerifierError || !codeVerifier) {
    const errorMessage = codeVerifierError || 'No code verifier found';
    console.error('/connect/openrouter: ' + errorMessage);
    return NextResponse.redirect(
      new URL(
        `/app/account?message=Failed to connect OpenRouter: ${errorMessage}`,
        request.url
      )
    );
  }

  console.log('/connect/openrouter: codeVerifier', codeVerifier);

  const response = await fetch('https://openrouter.ai/api/v1/auth/keys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      code_verifier: codeVerifier,
      code_challenge_method: 'S256',
    }),
  });

  if (!response.ok) {
    console.error(
      '/connect/openrouter: error fetching openrouter key',
      response
    );
    return NextResponse.redirect(
      new URL('/app/account?message=Failed to connect OpenRouter', request.url)
    );
  }

  const openrouterResponse = await response.json();

  console.log('full openrouter response', JSON.stringify(openrouterResponse));

  // Store the API key in the vault using our vault service (delete old key if exists, then create new)
  const { success, error } = await vaultService.replaceUserKey({
    key: USER_KEYS.OPENROUTER_API_KEY,
    value: openrouterResponse.key,
    description: 'OpenRouter API Key',
  });

  console.log('/connect/openrouter: store result', success, error);

  if (!success) {
    const errorMessage = error || 'Failed to save API key';
    console.error('/connect/openrouter: ' + errorMessage);
    return NextResponse.redirect(
      new URL(
        `/app/account?message=Failed to connect OpenRouter: ${errorMessage}`,
        request.url
      )
    );
  }

  console.log('/connect/openrouter: successfully saved openrouter key');

  return NextResponse.redirect(new URL('/app/account', request.url));
}
