import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import {
  handle,
  jsonOk,
  requireApiPermission,
  requireApiUser
} from '@/lib/api';
import { isVendor } from '@/lib/rbac';

export const GET = handle(async (req: NextRequest) => {
  const user = await requireApiUser();
  await requireApiPermission(user, 'user:manage');

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('organizationId') ?? undefined;

  // CUSTOMER_ADMIN may only see users from their own organization.
  const where: Record<string, unknown> = {};
  if (!isVendor(user.role)) {
    where.organizationId = user.organizationId;
  } else if (orgId) {
    where.organizationId = orgId;
  }

  const users = await db.user.findMany({
    where,
    include: {
      organization: { select: { id: true, name: true, type: true } }
    },
    orderBy: [{ organization: { name: 'asc' } }, { name: 'asc' }]
  });

  return jsonOk(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      organization: u.organization
    }))
  );
});
