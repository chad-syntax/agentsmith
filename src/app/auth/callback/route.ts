import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { routes } from '@/utils/routes';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { extractSessionId } from '@/utils/extract-session-id';

// The `/auth/callback` route is required for the server-side auth flow implemented
// by the SSR package. It exchanges an auth code for the user's session.
// https://supabase.com/docs/guides/auth/server-side/nextjs

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get('redirect_to')?.toString();

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Exchanging code for session failed!', error);
      return NextResponse.redirect(
        `${origin}${routes.error('Exchanging code for session failed!')}`,
      );
    }

    if (!data || !data.user) {
      console.error('User data not found!');
      return NextResponse.redirect(`${origin}${routes.error('User data not found!')}`);
    }

    if (!data.session) {
      console.error('Session data not found!');
      return NextResponse.redirect(`${origin}${routes.error('Session data not found!')}`);
    }

    const { user, session } = data;

    const sessionId = extractSessionId(session);

    if (!sessionId) {
      console.error('Session ID not found!');
      return NextResponse.redirect(`${origin}${routes.error('Session ID not found!')}`);
    }

    const isGithubProvider = session?.user?.app_metadata?.provider === 'github';
    const providerToken = session?.provider_token;
    const providerRefreshToken = session?.provider_refresh_token;

    if (!isGithubProvider) {
      console.warn(
        'User is not using GitHub as their provider, Will not be able to make api requests to github',
      );
    }

    if (!isGithubProvider && (!providerToken || !providerRefreshToken)) {
      console.warn(
        'Provider token or refresh token not found! Will not be able to make api requests to github',
      );
    }

    if (isGithubProvider && providerToken && providerRefreshToken) {
      const agentsmith = new AgentsmithServices({ supabase });

      await agentsmith.services.github.saveGithubProviderTokens({
        supabaseUserId: user.id,
        sessionId,
        providerToken,
        providerRefreshToken,
      });
    }
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // URL to redirect to after sign up process completes
  return NextResponse.redirect(`${origin}${routes.studio.home}`);
}
