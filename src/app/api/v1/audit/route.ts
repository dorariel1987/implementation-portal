import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import {
  handle,
  jsonOk,
  requireApiPermission,
  requireApiUser
} from '@/lib/api';

const MAX_LIMIT = 200;

export const GET = handle(async (req: NextRequest) => {
  const user = await requireApiUser();
  await requireApiPermission(user, 'audit:view');

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') ?? undefined;
  const actorId = searchParams.get('actorId') ?? undefined;
  const resourceType = searchParams.get('resourceType') ?? undefined;
  const resourceId = searchParams.get('resourceId') ?? undefined;
  const since = searchParams.get('since');
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(searchParams.get('limit') ?? 50))
  );
  const cursor = searchParams.get('cursor') ?? undefined;

  const where: Record<string, unknown> = {};
  if (action) where.action = action;
  if (actorId) where.actorId = actorId;
  if (resourceType) where.resourceType = resourceType;
  if (resourceId) where.resourceId = resourceId;
  if (since) where.occurredAt = { gte: new Date(since) };

  const events = await db.auditLog.findMany({
    where,
    orderBy: { occurredAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      actor: { select: { id: true, name: true, email: true, role: true } }
    }
  });

  const hasMore = events.length > limit;
  const slice = hasMore ? events.slice(0, limit) : events;

  return jsonOk({
    events: slice.map((e) => ({
      id: e.id,
      occurredAt: e.occurredAt,
      action: e.action,
      actor: e.actor,
      actorEmail: e.actorEmail,
      resourceType: e.resourceType,
      resourceId: e.resourceId,
      ipAddress: e.ipAddress,
      userAgent: e.userAgent,
      metadata: e.metadata ? safeJson(e.metadata) : null
    })),
    nextCursor: hasMore ? slice[slice.length - 1]?.id ?? null : null
  });
});

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
