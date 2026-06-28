import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { listChamberImportRuns, runChamberImport } from '@/lib/ops-contacts-store';
import { resolveViewerRole } from '@/lib/ops-contacts-schema';

export const dynamic = 'force-dynamic';

/** GET — recent import runs (internal only) */
export async function GET(req: NextRequest) {
  try {
    await ensurePlatformSeed();
    const { searchParams } = new URL(req.url);
    const viewer = resolveViewerRole(searchParams.get('viewerRole'));
    if (viewer !== 'internal') {
      return NextResponse.json({ ok: false, error: 'Internal access only' }, { status: 403 });
    }

    const limit = parseInt(searchParams.get('limit') ?? '10', 10);
    const runs = await listChamberImportRuns(limit);
    return NextResponse.json({ ok: true, runs });
  } catch (err) {
    console.error('[ops/import]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Failed to list import runs' },
      { status: 500 }
    );
  }
}

/** POST — dry-run preview or commit chamber CSV import */
export async function POST(req: NextRequest) {
  try {
    await ensurePlatformSeed();
    const body = await req.json();
    const viewer = resolveViewerRole(body.viewerRole);
    if (viewer !== 'internal') {
      return NextResponse.json({ ok: false, error: 'Internal access only' }, { status: 403 });
    }

    const {
      dryRun = true,
      filePath,
      actorLabel = 'Internal admin',
      forceOverwriteManual = false,
    } = body as {
      dryRun?: boolean;
      filePath?: string;
      actorLabel?: string;
      forceOverwriteManual?: boolean;
    };

    const { run, dataSource } = await runChamberImport({
      dryRun,
      filePath,
      actorLabel,
      forceOverwriteManual,
    });

    return NextResponse.json({
      ok: true,
      dataSource,
      run,
      message: dryRun
        ? `Dry run — ${run.createdCount} create, ${run.updatedCount} update, ${run.skippedCount} skip, ${run.conflictCount} conflict`
        : `Import committed — ${run.createdCount} created, ${run.updatedCount} updated`,
    });
  } catch (err) {
    console.error('[ops/import POST]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Import failed' },
      { status: 500 }
    );
  }
}
