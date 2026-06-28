import { NextResponse } from 'next/server';
import { getDbStatus, resetDbStatusCache } from '@/lib/db-status';
import { getEffectiveDataSource, getPilotConfigSnapshot } from '@/lib/pilot-config';
import { ensurePlatformSeed } from '@/lib/platform-seed';

/** Pilot mode config + database connectivity snapshot */
export async function GET() {
  await ensurePlatformSeed();
  resetDbStatusCache();
  const db = await getDbStatus();
  const effectiveDataSource = getEffectiveDataSource();

  return NextResponse.json({
    ok: true,
    ...getPilotConfigSnapshot(),
    /** Runtime mode after connectivity probe — use this to confirm cutover */
    effectiveDataSource,
    db: {
      ...db,
      effectiveMode: effectiveDataSource,
    },
  });
}
