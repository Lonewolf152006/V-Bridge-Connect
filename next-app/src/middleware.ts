// VBridgeConnect — Next.js Middleware (Edge Runtime)
// Uses Edge-compatible NextAuth configuration from auth.config.ts.
// Avoids importing Prisma, bcrypt, or nodemailer into Edge runtime.

import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';

// Sanitize localhost NEXTAUTH_URL on Vercel/production so NextAuth never redirects to localhost
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  if (process.env.NEXTAUTH_URL && (process.env.NEXTAUTH_URL.includes('localhost') || process.env.NEXTAUTH_URL.includes('127.0.0.1'))) {
    delete process.env.NEXTAUTH_URL;
  }
  if (process.env.AUTH_URL && (process.env.AUTH_URL.includes('localhost') || process.env.AUTH_URL.includes('127.0.0.1'))) {
    delete process.env.AUTH_URL;
  }
  process.env.AUTH_TRUST_HOST = 'true';
}

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 1. Root path '/' always redirects to login page
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', req.nextUrl.origin));
  }

  // Allow public paths without auth redirection (including PWA manifest, service worker, icons, and TWA assetlinks)
  const publicPaths = [
    '/login',
    '/offline',
    '/sw.js',
    '/.well-known',
    '/_next',
    '/favicon.ico',
    '/manifest.webmanifest',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png',
    '/icon-maskable-512x512.png',
    '/api/auth',
    '/api/v1/certificates/verify',
    '/api/health',
  ];
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2. Resolve user role strictly from authenticated session or Bearer token
  const userRole = (req.auth?.user as { role?: string })?.role?.toLowerCase();
  const hasBearer = Boolean(req.headers.get('authorization')?.startsWith('Bearer '));
  const isAuth = Boolean(req.auth?.user) || hasBearer;

  // 3. If unauthenticated, return 401 for API or redirect pages to login
  if (!isAuth) {
    if (pathname.startsWith('/api')) {
      const requestId = crypto.randomUUID();
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            details: [],
            requestId,
          },
        },
        {
          status: 401,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-Request-Id': requestId,
          },
        }
      );
    }
    const loginUrl = new URL('/login', req.nextUrl.origin);
    if (pathname !== '/' && pathname !== '/login') {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 4. Role-based route protection
  if (pathname.startsWith('/coordinator') || pathname.startsWith('/mentor')) {
    if (userRole !== 'coordinator' && userRole !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
    }
  }

  if (pathname.startsWith('/admin')) {
    if (pathname.startsWith('/admin/reports') || pathname.startsWith('/admin/people')) {
      if (userRole !== 'super_admin' && userRole !== 'coordinator') {
        return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
      }
    } else if (userRole !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  // Run middleware on all routes except static assets and Next.js internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
