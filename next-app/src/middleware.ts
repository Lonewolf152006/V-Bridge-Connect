// VBridgeConnect — Next.js Middleware (Edge Runtime)
// Uses Edge-compatible NextAuth configuration from auth.config.ts.
// Avoids importing Prisma, bcrypt, or nodemailer into Edge runtime.

import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // Run middleware on all routes except static assets and Next.js internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
