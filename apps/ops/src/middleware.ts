import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const VALID_OPS_ROLES = ['admin', 'finance', 'warehouse'];

// Paths that are publicly accessible without authentication
const PUBLIC_PATHS = ['/login', '/auth/'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session cookie (keeps the session alive)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Public routes (login page, auth callback) ──────────────────────────────
  if (isPublicPath(pathname)) {
    // If already authenticated with a valid ops role, redirect away from login
    if (user && VALID_OPS_ROLES.includes(user.app_metadata?.role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return response;
  }

  // ── Protected routes — require authentication ──────────────────────────────
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Require a valid ops role (prevents customer accounts from accessing ops)
  const role = user.app_metadata?.role;
  if (!VALID_OPS_ROLES.includes(role)) {
    await supabase.auth.signOut();
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'no_access');
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
