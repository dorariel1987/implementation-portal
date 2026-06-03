import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'ip_session';

const PUBLIC_PATHS = ['/login', '/api/logout'];

const VENDOR_ONLY_PREFIXES = ['/admin'];

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    // Middleware runs at the edge; throwing here would be fatal,
    // so we treat it as unauthenticated to fail closed.
    return new TextEncoder().encode('missing-secret');
  }
  return new TextEncoder().encode(secret);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api/')
  ) {
    // API routes self-handle auth via requireApiUser() and return JSON 401/403
    // instead of redirecting to /login.
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  const token = req.cookies.get(COOKIE_NAME)?.value;
  let payload: { sub?: string; role?: string } | null = null;

  if (token) {
    try {
      const result = await jwtVerify(token, getSecret());
      payload = result.payload as { sub?: string; role?: string };
    } catch {
      payload = null;
    }
  }

  if (isPublic) {
    if (pathname === '/login' && payload?.sub) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  if (!payload?.sub) {
    const url = new URL('/login', req.url);
    if (pathname !== '/') url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  const requiresVendor = VENDOR_ONLY_PREFIXES.some((p) =>
    pathname.startsWith(p)
  );
  if (requiresVendor && !['OWNER', 'IMPLEMENTER'].includes(payload.role ?? '')) {
    return NextResponse.redirect(new URL('/dashboard?denied=1', req.url));
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/health).*)']
};
