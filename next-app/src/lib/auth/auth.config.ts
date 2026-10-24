// VBridgeConnect — NextAuth v5 Edge Configuration
// Contains only Edge-compatible settings, callbacks, and route rules.
// Does NOT import Prisma, bcrypt, or nodemailer so middleware runs without Node native module errors.

import type { NextAuthConfig } from 'next-auth';

// Sanitize localhost NEXTAUTH_URL on Vercel/production so NextAuth never redirects to localhost
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  if (
    process.env.NEXTAUTH_URL &&
    (process.env.NEXTAUTH_URL.includes('localhost') || process.env.NEXTAUTH_URL.includes('127.0.0.1'))
  ) {
    process.env.NEXTAUTH_URL = 'https://v-bridge-connect.vercel.app';
  }
  if (
    process.env.AUTH_URL &&
    (process.env.AUTH_URL.includes('localhost') || process.env.AUTH_URL.includes('127.0.0.1'))
  ) {
    process.env.AUTH_URL = 'https://v-bridge-connect.vercel.app';
  }
  process.env.AUTH_TRUST_HOST = 'true';
}

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
      const publicPaths = ['/', '/login', '/api/auth', '/api/verify'];
      if (pathname === '/' || publicPaths.some((p) => pathname.startsWith(p))) {
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

      const userRole = (session?.user as { role?: string })?.role?.toLowerCase();

      // If session is not present, redirect to login on current domain
      if (!session?.user) {
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
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      try {
        const parsed = new URL(url);
        if (parsed.origin === baseUrl) return url;
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
          return `${baseUrl}${parsed.pathname}${parsed.search}`;
        }
      } catch {
        return baseUrl;
      }
      return baseUrl;
    },

    async jwt({ token, user, account }: any) {
      if (user) {
        token.userId = user.id;
        token.role = user.role || token.role || 'student';
        token.departmentId = user.departmentId ?? token.departmentId;
        token.departmentName = user.departmentName ?? token.departmentName;
        token.institutionalId = user.institutionalId ?? token.institutionalId;
        token.avatarUrl = user.avatarUrl || user.image || token.avatarUrl;
      }
      if (account?.provider === 'github' && account.access_token) {
        token.githubAccessToken = account.access_token;
      }
      if (account?.provider === 'google' && account.access_token) {
        token.googleAccessToken = account.access_token;
        if (account.refresh_token) {
          token.googleRefreshToken = account.refresh_token as string;
        }
      }
      return token;
    },

    async session({ session, token }: any) {
      if (token && session?.user) {
        if (token.userId) session.user.id = token.userId as string;
        if (token.role) session.user.role = token.role;
        session.user.departmentId = token.departmentId ?? null;
        session.user.departmentName = token.departmentName ?? null;
        session.user.institutionalId = token.institutionalId ?? null;
        session.user.avatarUrl = token.avatarUrl ?? null;
        if (token.googleAccessToken) {
          session.googleAccessToken = token.googleAccessToken;
        }
      }
      return session;
    },
  },

  providers: [], // Populated in auth.ts with Node.js providers
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    'vbridge-connect-super-secure-production-secret-2026-fallback-key-0123456789',
};
