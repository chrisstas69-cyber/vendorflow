import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { getOpsSourceHealth } from '@/lib/ops-contacts-store';
import { resolveViewerRole } from '@/lib/ops-contacts-schema';

export const dynamic = 'force-dynamic';

/** GET — scrape source health + chamber CSV freshness (internal only) */
export async function GET(req: NextRequest) {
  try {
    await ensurePlatformSeed();
    const { searchParams } = new URL(req.url);
    const viewer = resolveViewerRole(searchParams.get('viewerRole'));
    if (viewer !== 'internal') {
      return NextResponse.json({ ok: false, error: 'Internal access only' }, { status: 403 });
    }

    const health = await getOpsSourceHealth();
    return NextResponse.json({ ok: true, ...health });
  } catch (err) {
    console.error('[ops/sources/health]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Failed to load source health' },
      { status: 500 }
    );
  }
}
