import { NextResponse } from 'next/server';
import { getDbStatus } from '@/lib/db-status';
import { getPilotConfigSnapshot } from '@/lib/pilot-config';

/** Pilot mode config + database connectivity snapshot */
export async function GET() {
  const db = await getDbStatus();
  return NextResponse.json({ ok: true, ...getPilotConfigSnapshot(), db });
}
