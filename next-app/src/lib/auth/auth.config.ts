// VBridgeConnect — NextAuth v5 Edge Configuration
// Contains only Edge-compatible settings, callbacks, and route rules.
// Does NOT import Prisma, bcrypt, or nodemailer so middleware runs without Node native module errors.

import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: 'jwt' },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    // Page-level authorization — redirects unauthenticated users to /login
    async authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl;

      // Public routes: always allow
      const publicPaths = ['/login', '/api/auth', '/api/verify'];
      if (publicPaths.some((p) => pathname.startsWith(p))) {
        return true;
      }

      // Static assets and Next.js internals: always allow
      if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
      ) {
        return true;
      }

      // API routes handle their own auth (Bearer token, session, or public) and return JSON
      if (pathname.startsWith('/api')) {
        return true;
      }

      let userRole = (session?.user as { role?: string })?.role?.toLowerCase();

      // Check for demo user cookie
      const demoCookie = request.cookies.get('vbridge_demo_user');
      if (demoCookie?.value && !userRole) {
        try {
          const parsed = JSON.parse(decodeURIComponent(demoCookie.value));
          userRole = (parsed.role || '').toLowerCase();
        } catch {
          userRole = 'student';
        }
      }

      // If neither session nor demo cookie is present, redirect to login on current domain
      if (!session?.user && !demoCookie?.value) {
        const loginUrl = new URL('/login', request.nextUrl);
        if (pathname !== '/' && pathname !== '/login') {
          loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
        }
        return Response.redirect(loginUrl);
      }

      // Role-based path protection
      if (pathname.startsWith('/coordinator') || pathname.startsWith('/mentor')) {
        if (userRole !== 'coordinator' && userRole !== 'super_admin') {
          return Response.redirect(new URL('/dashboard', request.nextUrl));
        }
      }

      if (pathname.startsWith('/admin')) {
        // Faculty coordinators have access to Directory & Roles (/admin/people) and reports
        if (pathname.startsWith('/admin/people') || pathname.startsWith('/admin/reports')) {
          if (userRole !== 'super_admin' && userRole !== 'coordinator') {
            return Response.redirect(new URL('/dashboard', request.nextUrl));
          }
        } else if (userRole !== 'super_admin') {
          return Response.redirect(new URL('/dashboard', request.nextUrl));
        }
      }

      return true;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return url;
      try {
        const parsed = new URL(url);
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
          return `${parsed.pathname}${parsed.search}`;
        }
        if (parsed.origin === baseUrl) return url;
      } catch {
        return url;
      }
      return url;
    },
  },

  providers: [], // Populated in auth.ts with Node.js providers
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    'vbridge-connect-super-secure-production-secret-2026-fallback-key-0123456789',
};
