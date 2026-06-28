import { NextResponse } from 'next/server';
import { getPilotConfigSnapshot } from '@/lib/pilot-config';

/** Pilot mode config for client UI (banner, default season, data source indicator) */
export async function GET() {
  return NextResponse.json({ ok: true, ...getPilotConfigSnapshot() });
}
