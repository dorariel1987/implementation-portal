import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { recordAudit } from '@/lib/audit';
import {
  handle,
  jsonOk,
  parseJsonBody,
  requireApiPermission,
  requireApiUser
} from '@/lib/api';
import { ITEM_KINDS, ROLES } from '@/lib/types';

const createTemplateSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  items: z
    .array(
      z.object({
        title: z.string().min(2).max(200),
        description: z.string().max(4000).optional(),
        kind: z.enum(ITEM_KINDS as [string, ...string[]]).default('TASK'),
        requiredRole: z
          .enum(ROLES as [string, ...string[]])
          .nullable()
          .optional()
      })
    )
    .min(1, 'יש להגדיר לפחות שלב אחד')
});

export const GET = handle(async () => {
  const user = await requireApiUser();
  await requireApiPermission(user, 'project:view');

  const templates = await db.checklistTemplate.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { items: true, projects: true } }
    }
  });
  return jsonOk(
    templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      createdAt: t.createdAt,
      itemCount: t._count.items,
      projectCount: t._count.projects
    }))
  );
});

export const POST = handle(async (req: NextRequest) => {
  const user = await requireApiUser();
  await requireApiPermission(user, 'template:manage');

  const input = await parseJsonBody(req, createTemplateSchema);

  const tpl = await db.checklistTemplate.create({
    data: {
      name: input.name,
      description: input.description,
      items: {
        create: input.items.map((it, idx) => ({
          order: idx + 1,
          title: it.title,
          description: it.description,
          kind: it.kind,
          requiredRole: it.requiredRole ?? null
        }))
      }
    },
    include: { items: { orderBy: { order: 'asc' } } }
  });

  await recordAudit({
    action: 'TEMPLATE_CREATED',
    actorId: user.id,
    actorEmail: user.email,
    resourceType: 'ChecklistTemplate',
    resourceId: tpl.id,
    metadata: { name: tpl.name, itemCount: tpl.items.length, via: 'rest' }
  });

  return jsonOk(tpl, 201);
});
