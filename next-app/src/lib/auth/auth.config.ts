// VBridgeConnect — NextAuth v5 Edge Configuration
// Contains only Edge-compatible settings, callbacks, and route rules.
// Does NOT import Prisma, bcrypt, or nodemailer so middleware runs without Node native module errors.

import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
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

      // Everything else requires an authenticated session
      if (!session?.user) {
        return false; // NextAuth redirects to pages.signIn
      }

      // Role-based path protection
      const userRole = (session.user as { role?: string }).role;

      if (pathname.startsWith('/coordinator')) {
        if (userRole !== 'coordinator' && userRole !== 'super_admin') {
          return Response.redirect(new URL('/dashboard', request.nextUrl));
        }
      }

      if (pathname.startsWith('/admin')) {
        if (userRole !== 'super_admin') {
          return Response.redirect(new URL('/dashboard', request.nextUrl));
        }
      }

      return true;
    },
  },

  providers: [], // Populated in auth.ts with Node.js providers
  secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
};
