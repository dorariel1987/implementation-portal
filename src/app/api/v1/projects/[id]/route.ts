import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { recordAudit } from '@/lib/audit';
import { isVendor } from '@/lib/rbac';
import {
  handle,
  jsonError,
  jsonOk,
  parseJsonBody,
  requireApiPermission,
  requireApiUser
} from '@/lib/api';
import { PROJECT_STATUSES } from '@/lib/types';
import { serializeChecklistItem, serializeProjectSummary } from '../../_serializers';

interface Ctx {
  params: { id: string };
}

const updateProjectSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  status: z.enum(PROJECT_STATUSES as [string, ...string[]]).optional(),
  ownerId: z.string().min(1).optional(),
  targetDate: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === null ? null : new Date(v)))
});

async function loadProject(id: string) {
  return db.project.findUnique({
    where: { id },
    include: {
      customerOrg: true,
      owner: { select: { id: true, name: true, email: true } },
      template: { select: { id: true, name: true } },
      items: {
        orderBy: { order: 'asc' },
        include: {
          templateItem: true,
          assignedTo: { select: { id: true, name: true, email: true } },
          completedBy: { select: { id: true, name: true, email: true } }
        }
      }
    }
  });
}

export const GET = handle(async (_req: NextRequest, { params }: Ctx) => {
  const user = await requireApiUser();
  await requireApiPermission(user, 'project:view');

  const project = await loadProject(params.id);
  if (!project) return jsonError('NOT_FOUND', 'הפרויקט לא נמצא', 404);

  if (!isVendor(user.role) && project.customerOrgId !== user.organizationId) {
    return jsonError('NOT_FOUND', 'הפרויקט לא נמצא', 404);
  }

  return jsonOk({
    ...serializeProjectSummary(project),
    items: project.items.map(serializeChecklistItem)
  });
});

export const PATCH = handle(async (req: NextRequest, { params }: Ctx) => {
  const user = await requireApiUser();
  await requireApiPermission(user, 'project:update');

  const project = await loadProject(params.id);
  if (!project) return jsonError('NOT_FOUND', 'הפרויקט לא נמצא', 404);

  const input = await parseJsonBody(req, updateProjectSchema);
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.status !== undefined) data.status = input.status;
  if (input.ownerId !== undefined) data.ownerId = input.ownerId;
  if (input.targetDate !== undefined) data.targetDate = input.targetDate;

  if (Object.keys(data).length === 0) {
    return jsonError('NO_CHANGES', 'לא הועברו שדות לעדכון', 422);
  }

  const updated = await db.project.update({
    where: { id: project.id },
    data,
    include: {
      customerOrg: true,
      owner: { select: { id: true, name: true, email: true } },
      template: { select: { id: true, name: true } },
      items: { select: { status: true } }
    }
  });

  if (input.status && input.status !== project.status) {
    await recordAudit({
      action: 'PROJECT_STATUS_CHANGED',
      actorId: user.id,
      actorEmail: user.email,
      resourceType: 'Project',
      resourceId: project.id,
      metadata: { from: project.status, to: input.status, via: 'rest' }
    });
  }
  await recordAudit({
    action: 'PROJECT_UPDATED',
    actorId: user.id,
    actorEmail: user.email,
    resourceType: 'Project',
    resourceId: project.id,
    metadata: { fields: Object.keys(data), via: 'rest' }
  });

  return jsonOk(serializeProjectSummary(updated));
});

export const DELETE = handle(async (_req: NextRequest, { params }: Ctx) => {
  const user = await requireApiUser();
  await requireApiPermission(user, 'project:delete');

  const project = await db.project.findUnique({ where: { id: params.id } });
  if (!project) return jsonError('NOT_FOUND', 'הפרויקט לא נמצא', 404);

  await db.project.delete({ where: { id: project.id } });

  await recordAudit({
    action: 'PROJECT_DELETED',
    actorId: user.id,
    actorEmail: user.email,
    resourceType: 'Project',
    resourceId: project.id,
    metadata: { name: project.name, via: 'rest' }
  });

  return jsonOk({ deleted: true, id: project.id });
});
