import { db } from './db';
import {
  getRequestContext,
  setSessionCookie,
  signSession,
  verifyPassword
} from './auth';
import { recordAudit } from './audit';
import { consumeRateLimit, resetRateLimit } from './rate-limit';
import type { Role } from './types';

// Brute-force protection: at most N attempts per (email + ip) within the window.
const LOGIN_MAX_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
}

export type AuthOutcome =
  | { ok: true; token: string; user: AuthenticatedUser }
  | {
      ok: false;
      code: 'RATE_LIMITED' | 'INVALID_CREDENTIALS';
      message: string;
      retryAfterSeconds?: number;
    };

/**
 * Single source of truth for credential authentication, shared by the browser
 * Server Action and the REST `/api/v1/auth/login` route. Handles rate limiting,
 * password verification, session issuance, and audit logging.
 *
 * On success the session cookie is set AND the raw JWT is returned (for Bearer
 * clients). Callers decide how to surface failures (redirect vs. JSON).
 */
export async function authenticateCredentials(
  emailRaw: string,
  password: string,
  opts: { via: 'web' | 'rest' }
): Promise<AuthOutcome> {
  const email = emailRaw.trim().toLowerCase();
  const { ip } = getRequestContext();
  const rlKey = `login:${email}:${ip ?? 'unknown'}`;

  const rl = consumeRateLimit(rlKey, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS);
  if (!rl.allowed) {
    await recordAudit({
      action: 'USER_LOGIN_FAILED',
      actorEmail: email,
      resourceType: 'User',
      metadata: { reason: 'rate_limited', via: opts.via }
    });
    return {
      ok: false,
      code: 'RATE_LIMITED',
      message: 'יותר מדי ניסיונות התחברות. נסו שוב בעוד מספר דקות.',
      retryAfterSeconds: rl.retryAfterSeconds
    };
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    await recordAudit({
      action: 'USER_LOGIN_FAILED',
      actorId: user?.id ?? null,
      actorEmail: email,
      resourceType: 'User',
      resourceId: user?.id ?? null,
      metadata: { reason: 'unknown_or_inactive', via: opts.via }
    });
    return {
      ok: false,
      code: 'INVALID_CREDENTIALS',
      message: 'מייל או סיסמה שגויים'
    };
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    await recordAudit({
      action: 'USER_LOGIN_FAILED',
      actorId: user.id,
      actorEmail: user.email,
      resourceType: 'User',
      resourceId: user.id,
      metadata: { reason: 'bad_password', via: opts.via }
    });
    return {
      ok: false,
      code: 'INVALID_CREDENTIALS',
      message: 'מייל או סיסמה שגויים'
    };
  }

  // Success: clear the limiter for this key so legitimate users aren't punished.
  resetRateLimit(rlKey);

  const token = await signSession({
    sub: user.id,
    email: user.email,
    role: user.role as Role,
    organizationId: user.organizationId,
    name: user.name
  });
  await setSessionCookie(token);

  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  await recordAudit({
    action: 'USER_LOGIN',
    actorId: user.id,
    actorEmail: user.email,
    resourceType: 'User',
    resourceId: user.id,
    metadata: { via: opts.via }
  });

  return {
    ok: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      organizationId: user.organizationId
    }
  };
}
