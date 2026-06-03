import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { recordAudit } from '@/lib/audit';
import { isVendor, meetsRoleRequirement } from '@/lib/rbac';
import {
  handle,
  jsonError,
  jsonOk,
  parseJsonBody,
  requireApiUser
} from '@/lib/api';
import { ITEM_STATUSES } from '@/lib/types';
import { serializeChecklistItem } from '../../_serializers';

interface Ctx {
  params: { id: string };
}

const patchSchema = z.object({
  status: z.enum(ITEM_STATUSES as [string, ...string[]]).optional(),
  notes: z.string().max(2000).nullable().optional(),
  payload: z.string().max(10_000).nullable().optional(),
  assignedToId: z.string().nullable().optional()
});

async function loadFull(id: string) {
  return db.projectChecklistItem.findUnique({
    where: { id },
    include: {
      templateItem: true,
      project: true,
      assignedTo: { select: { id: true, name: true, email: true } },
      completedBy: { select: { id: true, name: true, email: true } }
    }
  });
}

export const GET = handle(async (_req: NextRequest, { params }: Ctx) => {
  const user = await requireApiUser();
  const item = await loadFull(params.id);
  if (!item) return jsonError('NOT_FOUND', 'המשימה לא נמצאה', 404);
  if (!isVendor(user.role) && item.project.customerOrgId !== user.organizationId) {
    return jsonError('NOT_FOUND', 'המשימה לא נמצאה', 404);
  }
  return jsonOk(serializeChecklistItem(item));
});

export const PATCH = handle(async (req: NextRequest, { params }: Ctx) => {
  const user = await requireApiUser();
  const item = await loadFull(params.id);
  if (!item) return jsonError('NOT_FOUND', 'המשימה לא נמצאה', 404);

  if (!isVendor(user.role) && item.project.customerOrgId !== user.organizationId) {
    await recordAudit({
      action: 'PERMISSION_DENIED',
      actorId: user.id,
      actorEmail: user.email,
      resourceType: 'ProjectChecklistItem',
      resourceId: item.id,
      metadata: { reason: 'cross_tenant', via: 'rest' }
    });
    return jsonError('NOT_FOUND', 'המשימה לא נמצאה', 404);
  }

  const input = await parseJsonBody(req, patchSchema);

  const isStatusChange =
    input.status !== undefined && input.status !== item.status;

  // Status transitions are gated by the template's requiredRole.
  if (
    isStatusChange &&
    !meetsRoleRequirement(user.role, item.templateItem.requiredRole)
  ) {
    await recordAudit({
      action: 'PERMISSION_DENIED',
      actorId: user.id,
      actorEmail: user.email,
      resourceType: 'ProjectChecklistItem',
      resourceId: item.id,
      metadata: {
        reason: 'role_too_low',
        required: item.templateItem.requiredRole,
        via: 'rest'
      }
    });
    return jsonError('FORBIDDEN', 'נדרשת רמת הרשאה גבוהה יותר לשלב זה', 403);
  }

  // Assignment changes require item:assign.
  if (input.assignedToId !== undefined) {
    if (!isVendor(user.role) && user.role !== 'CUSTOMER_ADMIN') {
      return jsonError('FORBIDDEN', 'אין הרשאה להקצות משימות', 403);
    }
    if (input.assignedToId) {
      const target = await db.user.findUnique({
        where: { id: input.assignedToId }
      });
      if (!target) {
        return jsonError('USER_NOT_FOUND', 'המשתמש להקצאה לא נמצא', 422);
      }
    }
  }

  const willComplete = input.status === 'COMPLETED';
  const data: Record<string, unknown> = {};
  if (input.status !== undefined) data.status = input.status;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.payload !== undefined) data.payload = input.payload;
  if (input.assignedToId !== undefined) data.assignedToId = input.assignedToId;
  if (input.status !== undefined) {
    data.completedAt = willComplete ? new Date() : null;
    data.completedById = willComplete ? user.id : null;
  }

  const updated = await db.projectChecklistItem.update({
    where: { id: item.id },
    data,
    include: {
      templateItem: true,
      project: true,
      assignedTo: { select: { id: true, name: true, email: true } },
      completedBy: { select: { id: true, name: true, email: true } }
    }
  });

  // Auto-advance project status: DRAFT -> ACTIVE on first activity.
  if (
    isStatusChange &&
    item.project.status === 'DRAFT' &&
    input.status !== 'PENDING'
  ) {
    await db.project.update({
      where: { id: item.projectId },
      data: { status: 'ACTIVE' }
    });
    await recordAudit({
      action: 'PROJECT_STATUS_CHANGED',
      actorId: user.id,
      actorEmail: user.email,
      resourceType: 'Project',
      resourceId: item.projectId,
      metadata: {
        from: 'DRAFT',
        to: 'ACTIVE',
        trigger: 'first_item_activity',
        via: 'rest'
      }
    });
  }

  // Auto-complete project when all items done.
  if (willComplete) {
    const remaining = await db.projectChecklistItem.count({
      where: {
        projectId: item.projectId,
        status: { notIn: ['COMPLETED', 'SKIPPED'] }
      }
    });
    if (remaining === 0) {
      await db.project.update({
        where: { id: item.projectId },
        data: { status: 'COMPLETED' }
      });
      await recordAudit({
        action: 'PROJECT_STATUS_CHANGED',
        actorId: user.id,
        actorEmail: user.email,
        resourceType: 'Project',
        resourceId: item.projectId,
        metadata: { to: 'COMPLETED', trigger: 'all_items_done', via: 'rest' }
      });
    }
  }

  if (isStatusChange) {
    await recordAudit({
      action: willComplete ? 'ITEM_COMPLETED' : 'ITEM_STATUS_CHANGED',
      actorId: user.id,
      actorEmail: user.email,
      resourceType: 'ProjectChecklistItem',
      resourceId: item.id,
      metadata: {
        from: item.status,
        to: input.status,
        title: item.templateItem.title,
        projectId: item.projectId,
        via: 'rest'
      }
    });
  }
  if (input.assignedToId !== undefined && input.assignedToId !== item.assignedToId) {
    await recordAudit({
      action: 'ITEM_ASSIGNED',
      actorId: user.id,
      actorEmail: user.email,
      resourceType: 'ProjectChecklistItem',
      resourceId: item.id,
      metadata: { to: input.assignedToId, via: 'rest' }
    });
  }

  return jsonOk(serializeChecklistItem(updated));
});
