import { createClient } from '~/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    console.error('/connect/openrouter: no code found');
    return NextResponse.redirect(
      new URL('/app/account?message=Failed to connect OpenRouter', request.url)
    );
  }

  const codeVerifier = process.env.OPENROUTER_CODE_VERIFIER;

  if (!codeVerifier) {
    console.error('/connect/openrouter: no code verifier found');
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

  const { data: agentsmithUser, error: agentsmithUserError } = await supabase
    .from('agentsmith_users')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (agentsmithUserError) {
    console.error(
      '/connect/openrouter: error fetching agentsmith user',
      agentsmithUserError
    );
    return NextResponse.redirect(
      new URL('/app/account?message=Failed to connect OpenRouter', request.url)
    );
  }

  if (!agentsmithUser) {
    console.error('/connect/openrouter: no agentsmith user found');
    return NextResponse.redirect(
      new URL('/app/account?message=Failed to connect OpenRouter', request.url)
    );
  }

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

  const { data, error } = await supabase
    .from('agentsmith_users')
    .update({
      openrouter_code: code,
      openrouter_api_key: openrouterResponse.key,
    })
    .eq('id', agentsmithUser.id);

  console.log('/connect/openrouter: data, error', data, error);

  if (error) {
    console.error('/connect/openrouter: error saving openrouter key', error);
    return NextResponse.redirect(
      new URL('/app/account?message=Failed to connect OpenRouter', request.url)
    );
  }

  console.log('/connect/openrouter: successfully saved openrouter key');

  return NextResponse.redirect(new URL('/app/account', request.url));
}
