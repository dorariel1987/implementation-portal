import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const startedAt = Date.now();

// Unauthenticated liveness/readiness probe (excluded from auth in middleware).
// Returns 200 when the DB is reachable, 503 otherwise — suitable for k8s probes
// and uptime monitors.
export async function GET() {
  let dbUp = true;
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    dbUp = false;
  }

  return NextResponse.json(
    {
      status: dbUp ? 'ok' : 'degraded',
      checks: { database: dbUp ? 'up' : 'down' },
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString()
    },
    { status: dbUp ? 200 : 503 }
  );
}
