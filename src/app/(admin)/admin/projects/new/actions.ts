'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { recordAudit } from '@/lib/audit';
import { canAccessAdmin } from '@/lib/rbac';
import { createProjectSchema } from '@/lib/validation';
import { getServerDictionary } from '@/lib/i18n/server';

export type CreateProjectState = { error?: string };

export async function createProject(
  _prev: CreateProjectState,
  formData: FormData
): Promise<CreateProjectState> {
  const user = await requireUser();
  const { t } = getServerDictionary();
  if (!canAccessAdmin(user.role)) {
    return { error: t.newProject.noPermission };
  }

  let parsed;
  try {
    parsed = createProjectSchema.parse({
      name: formData.get('name'),
      customerOrgId: formData.get('customerOrgId'),
      templateId: formData.get('templateId'),
      ownerId: formData.get('ownerId'),
      targetDate: formData.get('targetDate') || undefined
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { error: t.newProject.invalidData };
    }
    throw err;
  }

  const template = await db.checklistTemplate.findUnique({
    where: { id: parsed.templateId },
    include: { items: { orderBy: { order: 'asc' } } }
  });
  if (!template) return { error: t.newProject.templateNotFound };

  const project = await db.project.create({
    data: {
      name: parsed.name,
      customerOrgId: parsed.customerOrgId,
      templateId: parsed.templateId,
      ownerId: parsed.ownerId,
      targetDate: parsed.targetDate,
      status: 'DRAFT',
      items: {
        create: template.items.map((ti) => ({
          templateItemId: ti.id,
          order: ti.order,
          status: 'PENDING'
        }))
      }
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
      templateId: parsed.templateId,
      customerOrgId: parsed.customerOrgId,
      itemCount: template.items.length
    }
  });

  redirect(`/projects/${project.id}`);
}
