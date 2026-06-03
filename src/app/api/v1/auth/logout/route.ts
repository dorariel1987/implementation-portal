import { clearSessionCookie } from '@/lib/auth';
import { recordAudit } from '@/lib/audit';
import { getApiUser, handle, jsonOk } from '@/lib/api';

export const POST = handle(async () => {
  const user = await getApiUser();
  if (user) {
    await recordAudit({
      action: 'USER_LOGOUT',
      actorId: user.id,
      actorEmail: user.email,
      resourceType: 'User',
      resourceId: user.id,
      metadata: { via: 'rest' }
    });
  }
  await clearSessionCookie();
  return jsonOk({ loggedOut: true });
});
