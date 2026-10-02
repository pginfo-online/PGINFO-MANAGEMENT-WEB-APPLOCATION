import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/properties',
  '/tenants',
  '/rooms',
  '/beds',
  '/payments',
  '/expenses',
  '/agreements',
  '/staff',
  '/rent',
  '/settings',
];

// Routes accessible only to unauthenticated users
const AUTH_ROUTES = ['/login', '/verify-otp', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read auth token from cookie (set by client after login)
  const token = request.cookies.get('pg_auth_token')?.value;
  const isAuthenticated = Boolean(token);

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Unauthenticated user trying to access a protected route
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to access auth routes → send to dashboard
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, public/ assets
     * - api/ routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/).*)',
  ],
};
