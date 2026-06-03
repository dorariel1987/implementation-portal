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
import { createProjectSchema } from '@/lib/validation';
import { serializeProjectSummary } from '../_serializers';

export const GET = handle(async (req: NextRequest) => {
  const user = await requireApiUser();
  await requireApiPermission(user, 'project:view');

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? undefined;
  const customerOrgId = searchParams.get('customerOrgId') ?? undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (customerOrgId) where.customerOrgId = customerOrgId;
  if (!isVendor(user.role)) {
    // Customers see only their own projects, regardless of filter.
    where.customerOrgId = user.organizationId;
  }

  const projects = await db.project.findMany({
    where,
    include: {
      customerOrg: true,
      owner: { select: { id: true, name: true, email: true } },
      template: { select: { id: true, name: true } },
      items: { select: { status: true } }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return jsonOk(projects.map(serializeProjectSummary));
});

export const POST = handle(async (req: NextRequest) => {
  const user = await requireApiUser();
  await requireApiPermission(user, 'project:create');

  const input = await parseJsonBody(req, createProjectSchema);

  const template = await db.checklistTemplate.findUnique({
    where: { id: input.templateId },
    include: { items: { orderBy: { order: 'asc' } } }
  });
  if (!template) {
    return jsonError('TEMPLATE_NOT_FOUND', 'התבנית לא נמצאה', 404);
  }

  const customer = await db.organization.findUnique({
    where: { id: input.customerOrgId }
  });
  if (!customer || customer.type !== 'CUSTOMER') {
    return jsonError(
      'INVALID_CUSTOMER',
      'ארגון הלקוח לא נמצא או אינו לקוח',
      422
    );
  }

  const project = await db.project.create({
    data: {
      name: input.name,
      customerOrgId: input.customerOrgId,
      templateId: input.templateId,
      ownerId: input.ownerId,
      targetDate: input.targetDate,
      status: 'DRAFT',
      items: {
        create: template.items.map((ti) => ({
          templateItemId: ti.id,
          order: ti.order,
          status: 'PENDING'
        }))
      }
    },
    include: {
      customerOrg: true,
      owner: { select: { id: true, name: true, email: true } },
      template: { select: { id: true, name: true } },
      items: { select: { status: true } }
    }
  });

  await recordAudit({
    action: 'PROJECT_CREATED',
    actorId: user.id,
    actorEmail: user.email,
    resourceType: 'Project',
    resourceId: project.id,
    metadata: {
      name: project.name,
      templateId: input.templateId,
      customerOrgId: input.customerOrgId,
      itemCount: template.items.length,
      via: 'rest'
    }
  });

  return jsonOk(serializeProjectSummary(project), 201);
});
