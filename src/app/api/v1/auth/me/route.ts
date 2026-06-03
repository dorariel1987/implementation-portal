import { db } from '@/lib/db';
import { handle, jsonOk, requireApiUser } from '@/lib/api';

export const GET = handle(async () => {
  const me = await requireApiUser();
  const full = await db.user.findUnique({
    where: { id: me.id },
    include: { organization: true }
  });
  if (!full) {
    // Should be unreachable because requireApiUser already verified existence.
    return jsonOk({ id: me.id });
  }
  return jsonOk({
    id: full.id,
    email: full.email,
    name: full.name,
    role: full.role,
    isActive: full.isActive,
    lastLoginAt: full.lastLoginAt,
    organization: {
      id: full.organization.id,
      name: full.organization.name,
      type: full.organization.type
    }
  });
});
