import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { isVendor } from '@/lib/rbac';
import {
  handle,
  jsonError,
  jsonOk,
  requireApiPermission,
  requireApiUser
} from '@/lib/api';
import { serializeChecklistItem } from '../../../_serializers';

interface Ctx {
  params: { id: string };
}

export const GET = handle(async (_req: NextRequest, { params }: Ctx) => {
  const user = await requireApiUser();
  await requireApiPermission(user, 'project:view');

  const project = await db.project.findUnique({
    where: { id: params.id },
    select: { id: true, customerOrgId: true }
  });
  if (!project) return jsonError('NOT_FOUND', 'הפרויקט לא נמצא', 404);
  if (!isVendor(user.role) && project.customerOrgId !== user.organizationId) {
    return jsonError('NOT_FOUND', 'הפרויקט לא נמצא', 404);
  }

  const items = await db.projectChecklistItem.findMany({
    where: { projectId: project.id },
    orderBy: { order: 'asc' },
    include: {
      templateItem: true,
      assignedTo: { select: { id: true, name: true, email: true } },
      completedBy: { select: { id: true, name: true, email: true } }
    }
  });

  return jsonOk(items.map(serializeChecklistItem));
});
