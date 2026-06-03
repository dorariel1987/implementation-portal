import { db } from './db';
import { getRequestContext } from './auth';

export type AuditAction =
  | 'USER_LOGIN'
  | 'USER_LOGIN_FAILED'
  | 'USER_LOGOUT'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DEACTIVATED'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_STATUS_CHANGED'
  | 'PROJECT_DELETED'
  | 'ITEM_STATUS_CHANGED'
  | 'ITEM_COMPLETED'
  | 'ITEM_ASSIGNED'
  | 'ITEM_APPROVED'
  | 'ITEM_NOTE_ADDED'
  | 'TEMPLATE_CREATED'
  | 'TEMPLATE_UPDATED'
  | 'PERMISSION_DENIED';

export interface AuditEvent {
  action: AuditAction;
  actorId?: string | null;
  actorEmail?: string | null;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function recordAudit(event: AuditEvent): Promise<void> {
  const { ip, userAgent } = safeRequestContext();
  await db.auditLog.create({
    data: {
      action: event.action,
      actorId: event.actorId ?? null,
      actorEmail: event.actorEmail ?? null,
      resourceType: event.resourceType,
      resourceId: event.resourceId ?? null,
      ipAddress: ip,
      userAgent,
      metadata: event.metadata ? JSON.stringify(event.metadata) : null
    }
  });
}

function safeRequestContext(): { ip: string | null; userAgent: string | null } {
  try {
    return getRequestContext();
  } catch {
    return { ip: null, userAgent: null };
  }
}
