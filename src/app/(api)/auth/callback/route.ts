import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { routes } from '@/utils/routes';

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
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // URL to redirect to after sign up process completes
  return NextResponse.redirect(`${origin}${routes.studio.home}`);
}
