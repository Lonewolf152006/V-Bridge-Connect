// VBridgeConnect — JWT Utilities
// architecture.md §8: Bearer JWT on every request.
// Short-lived access token + refresh token via jose.

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'vbridgeconnect-dev-secret-change-in-prod'
);

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface TokenPayload extends JWTPayload {
  userId: string;
  role: string;
  departmentId?: string;
  email: string;
}

export async function signAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp' | 'iss'>): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setIssuer('vbridgeconnect')
    .sign(JWT_SECRET);
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ userId } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setIssuer('vbridgeconnect')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET, {
    issuer: 'vbridgeconnect',
  });
  return payload as TokenPayload;
}

/**
 * Extract and verify the JWT from an incoming request's Authorization header.
 * Returns the decoded payload or throws.
 */
export async function authenticateRequest(request: Request): Promise<TokenPayload> {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      return await verifyToken(token);
    } catch {
      throw new AuthError('Invalid or expired token', 401);
    }
  }

  // NextAuth v5 session fallback for browser requests
  try {
    const { auth } = await import('./auth');
    const session = await auth();
    if (session?.user?.id) {
      return {
        userId: session.user.id,
        role: session.user.role,
        departmentId: session.user.departmentId || undefined,
        email: session.user.email,
      };
    }
  } catch {
    // fall through to AuthError
  }

  throw new AuthError('Missing or invalid Authorization header', 401);
}

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}
