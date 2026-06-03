'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { recordAudit } from '@/lib/audit';
import { isVendor, meetsRoleRequirement } from '@/lib/rbac';
import { updateItemStatusSchema } from '@/lib/validation';
import { getServerDictionary } from '@/lib/i18n/server';

export type ItemActionState = { error?: string; success?: string };

export async function updateItemStatus(
  _prev: ItemActionState,
  formData: FormData
): Promise<ItemActionState> {
  const user = await requireUser();
  const { t } = getServerDictionary();

  let parsed;
  try {
    parsed = updateItemStatusSchema.parse({
      itemId: String(formData.get('itemId') ?? ''),
      status: String(formData.get('status') ?? ''),
      notes: (formData.get('notes') as string) || undefined,
      payload: (formData.get('payload') as string) || undefined
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { error: t.item.invalidData };
    }
    throw err;
  }

  const item = await db.projectChecklistItem.findUnique({
    where: { id: parsed.itemId },
    include: { project: true, templateItem: true }
  });

  if (!item) return { error: t.item.notFound };

  // Tenancy & RBAC
  if (
    !isVendor(user.role) &&
    item.project.customerOrgId !== user.organizationId
  ) {
    await recordAudit({
      action: 'PERMISSION_DENIED',
      actorId: user.id,
      actorEmail: user.email,
      resourceType: 'ProjectChecklistItem',
      resourceId: item.id,
      metadata: { reason: 'cross_tenant' }
    });
    return { error: t.item.noAccess };
  }

  if (!meetsRoleRequirement(user.role, item.templateItem.requiredRole)) {
    await recordAudit({
      action: 'PERMISSION_DENIED',
      actorId: user.id,
      actorEmail: user.email,
      resourceType: 'ProjectChecklistItem',
      resourceId: item.id,
      metadata: { reason: 'role_too_low', required: item.templateItem.requiredRole }
    });
    return { error: t.item.requiresHigherRole };
  }

  const now = new Date();
  const isComplete = parsed.status === 'COMPLETED';

  await db.projectChecklistItem.update({
    where: { id: item.id },
    data: {
      status: parsed.status,
      notes: parsed.notes ?? item.notes,
      payload: parsed.payload ?? item.payload,
      completedAt: isComplete ? now : null,
      completedById: isComplete ? user.id : null
    }
  });

  // Auto-advance project status when first item is started
  if (item.project.status === 'DRAFT' && parsed.status !== 'PENDING') {
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
      metadata: { from: 'DRAFT', to: 'ACTIVE', trigger: 'first_item_activity' }
    });
  }

  // Auto-complete project when last item is done
  if (isComplete) {
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
        metadata: { to: 'COMPLETED', trigger: 'all_items_done' }
      });
    }
  }

  await recordAudit({
    action: isComplete ? 'ITEM_COMPLETED' : 'ITEM_STATUS_CHANGED',
    actorId: user.id,
    actorEmail: user.email,
    resourceType: 'ProjectChecklistItem',
    resourceId: item.id,
    metadata: {
      from: item.status,
      to: parsed.status,
      title: item.templateItem.title,
      projectId: item.projectId
    }
  });

  revalidatePath(`/projects/${item.projectId}`);
  revalidatePath(`/projects/${item.projectId}/items/${item.id}`);

  if (isComplete) {
    const next = await db.projectChecklistItem.findFirst({
      where: {
        projectId: item.projectId,
        status: { notIn: ['COMPLETED', 'SKIPPED'] }
      },
      orderBy: { order: 'asc' }
    });
    if (next) {
      redirect(`/projects/${item.projectId}/items/${next.id}`);
    }
    redirect(`/projects/${item.projectId}`);
  }

  return { success: t.item.statusUpdated };
}
