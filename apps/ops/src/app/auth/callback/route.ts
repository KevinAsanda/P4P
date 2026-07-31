import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getPublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  
  if (forwardedHost && !forwardedHost.includes('localhost')) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '');
  }

  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }

  const rawOrigin = new URL(request.url).origin;
  if (rawOrigin.includes('localhost:10000') || rawOrigin.includes('localhost')) {
    return 'https://p4p-ops.onrender.com';
  }

  return rawOrigin;
}

export async function GET(request: NextRequest) {
  const origin = getPublicOrigin(request);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const error = searchParams.get('error');

  if (error) {
    console.error('[Auth Callback] Supabase returned error:', error, searchParams.get('error_description'));
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server Component context — safe to ignore
            }
          },
        },
      }
    );

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[Auth Callback] Code exchange failed:', exchangeError.message);
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }

    // Verify the invited user has a valid ops role
    const role = data.user?.app_metadata?.role;
    if (!role || !['admin', 'finance', 'warehouse'].includes(role)) {
      console.warn('[Auth Callback] User has no valid ops role after invite accept:', data.user?.email);
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=no_access`);
    }

    // Successful invite acceptance — redirect to dashboard
    return NextResponse.redirect(`${origin}${next}`);
  }

  // No code parameter in query — redirect to login on public origin
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
