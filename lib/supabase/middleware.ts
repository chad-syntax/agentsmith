import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export const updateSession = async (request: NextRequest) => {
  console.log('running supabase middleware');

  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // This will refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const { error } = await supabase.auth.getUser();

  // protected routes
  if (request.nextUrl.pathname.startsWith('/studio') && error) {
    console.log('redirecting to sign-in because user.error');
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  if (request.nextUrl.pathname === '/' && !error) {
    console.log('redirecting to app because !user.error');
    return NextResponse.redirect(new URL('/studio', request.url));
  }

  return response;
};
