import { NextResponse, type NextRequest } from 'next/server';
import { ZodError, type z } from 'zod';
import { db } from './db';
import { getSession, type SessionPayload } from './auth';
import { recordAudit } from './audit';
import { hasPermission, type Permission } from './rbac';

// ─────────────────────────────────────────────────────────────
// JSON response helpers (consistent shape across the API)
// ─────────────────────────────────────────────────────────────

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function jsonError(
  code: string,
  message: string,
  status = 400,
  details?: unknown
) {
  const body: ApiError = { ok: false, error: { code, message, details } };
  return NextResponse.json(body, { status });
}

// ─────────────────────────────────────────────────────────────
// Auth + RBAC guards
// ─────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: SessionPayload['role'];
  organizationId: string;
  isActive: boolean;
}

/**
 * Resolves the calling user from cookie OR Bearer token. Returns the live DB
 * record (so deactivated users are rejected even if their token is still valid).
 */
export async function getApiUser(): Promise<ApiUser | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.sub } });
  if (!user || !user.isActive) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as SessionPayload['role'],
    organizationId: user.organizationId,
    isActive: user.isActive
  };
}

export async function requireApiUser() {
  const user = await getApiUser();
  if (!user) {
    throw new ApiAuthError('UNAUTHENTICATED', 'נדרשת התחברות', 401);
  }
  return user;
}

export async function requireApiPermission(
  user: ApiUser,
  perm: Permission
): Promise<void> {
  if (!hasPermission(user.role, perm)) {
    await recordAudit({
      action: 'PERMISSION_DENIED',
      actorId: user.id,
      actorEmail: user.email,
      resourceType: 'API',
      metadata: { permission: perm }
    });
    throw new ApiAuthError('FORBIDDEN', `נדרשת הרשאה: ${perm}`, 403);
  }
}

export class ApiAuthError extends Error {
  status: number;
  code: string;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ─────────────────────────────────────────────────────────────
// Body parsing with Zod
// ─────────────────────────────────────────────────────────────

export async function parseJsonBody<TSchema extends z.ZodTypeAny>(
  req: NextRequest,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiAuthError('BAD_JSON', 'גוף הבקשה אינו JSON תקין', 400);
  }
  try {
    return schema.parse(raw) as z.infer<TSchema>;
  } catch (err) {
    if (err instanceof ZodError) {
      throw new ApiValidationError(err);
    }
    throw err;
  }
}

export class ApiValidationError extends Error {
  zod: ZodError;
  constructor(zod: ZodError) {
    super('Validation failed');
    this.zod = zod;
  }
}

// ─────────────────────────────────────────────────────────────
// Centralized handler wrapper (DRY error handling for every route)
// ─────────────────────────────────────────────────────────────

export type RouteHandler<TParams = Record<string, string>> = (
  req: NextRequest,
  ctx: { params: TParams }
) => Promise<Response>;

export function handle<TParams = Record<string, string>>(
  fn: RouteHandler<TParams>
): RouteHandler<TParams> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiAuthError) {
        return jsonError(err.code, err.message, err.status);
      }
      if (err instanceof ApiValidationError) {
        return jsonError(
          'VALIDATION_ERROR',
          'נתונים לא תקינים',
          422,
          err.zod.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message
          }))
        );
      }
      // eslint-disable-next-line no-console
      console.error('[api] unhandled error', err);
      return jsonError('INTERNAL_ERROR', 'שגיאה פנימית', 500);
    }
  };
}
