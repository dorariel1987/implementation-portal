import { NextResponse } from 'next/server';
import { clearSessionCookie, getSession } from '@/lib/auth';
import { recordAudit } from '@/lib/audit';

export async function POST(req: Request) {
  const session = await getSession();
  if (session) {
    await recordAudit({
      action: 'USER_LOGOUT',
      actorId: session.sub,
      actorEmail: session.email,
      resourceType: 'User',
      resourceId: session.sub
    });
  }
  await clearSessionCookie();
  const url = new URL('/login', req.url);
  return NextResponse.redirect(url, 303);
}
