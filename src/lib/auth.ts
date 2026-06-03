import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import bcrypt from 'bcryptjs';
import type { Role } from './types';
import { db } from './db';
import { getEnv, getSessionMaxAgeSeconds } from './env';

const COOKIE_NAME = 'ip_session';

function getSecret(): Uint8Array {
  return new TextEncoder().encode(getEnv().AUTH_SECRET);
}

export { getSessionMaxAgeSeconds };

export interface SessionPayload extends JWTPayload {
  sub: string;
  email: string;
  role: Role;
  organizationId: string;
  name: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function signSession(
  payload: Omit<SessionPayload, 'iat' | 'exp'>
): Promise<string> {
  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${getSessionMaxAgeSeconds()}s`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  cookies().set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: getSessionMaxAgeSeconds()
  });
}

export async function clearSessionCookie(): Promise<void> {
  cookies().delete(COOKIE_NAME);
}

/**
 * Reads the session from either:
 * - Authorization: Bearer <token>  (REST clients)
 * - the `ip_session` HTTP-only cookie  (browser)
 */
export async function getSession(): Promise<SessionPayload | null> {
  const authHeader = headers().get('authorization');
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    const fromHeader = await verifySession(token);
    if (fromHeader) return fromHeader;
  }
  const cookieToken = cookies().get(COOKIE_NAME)?.value;
  if (!cookieToken) return null;
  return verifySession(cookieToken);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}

export async function requireUser() {
  const session = await requireSession();
  const user = await db.user.findUnique({
    where: { id: session.sub },
    include: { organization: true }
  });
  if (!user || !user.isActive) {
    await clearSessionCookie();
    redirect('/login?reason=inactive');
  }
  return user;
}

export function getRequestContext(): { ip: string | null; userAgent: string | null } {
  const h = headers();
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    null;
  const userAgent = h.get('user-agent');
  return { ip, userAgent };
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
