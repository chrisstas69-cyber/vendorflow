import { NextRequest, NextResponse } from 'next/server';
import { getActiveOrganizerId, getPilotDataSource } from '@/lib/pilot-config';
import {
  getBoothMapFromDb,
  persistBoothAssignmentsDb,
  updateBoothLayoutDb,
} from '@/lib/organizer-db-store';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import {
  getEventLayoutSeed,
  persistAssignmentsSeed,
  updateEventLayoutSeed,
} from '@/lib/booth/booth-layout-seed-store';
import type { StreetFairLayoutDefinition } from '@/lib/booth/street-fair-schema';
import type { LayoutMode } from '@/lib/booth/street-fair-schema';

export const dynamic = 'force-dynamic';

/** GET — booth map + assignments for an event */
export async function GET(req: NextRequest) {
  await ensurePlatformSeed();

  const { searchParams } = new URL(req.url);
  const organizerId = searchParams.get('organizerId') ?? getActiveOrganizerId();
  const eventId = searchParams.get('eventId');

  if (!eventId) {
    return NextResponse.json({ ok: false, error: 'eventId is required' }, { status: 400 });
  }

  if (getPilotDataSource() !== 'db') {
    const state = getEventLayoutSeed(organizerId, eventId);
    return NextResponse.json({
      ok: true,
      dataSource: 'seed',
      eventId,
      layoutMode: state.layoutMode,
      grid: state.layoutMode === 'grid' ? state.grid : [],
      streetFair: state.streetFair,
      generatedBooths: state.layoutMode === 'street-fair' ? state.generatedBooths : [],
      assignments: (state.layoutMode === 'street-fair' ? state.generatedBooths : state.grid)
        .filter(b => b.vendorEmail)
        .map(b => ({
          boothLabel: b.label,
          applicationId: b.applicationId,
          vendorEmail: b.vendorEmail!,
          vendorName: b.vendorName!,
          utilities: b.utilities ?? [],
        })),
    });
  }

  const map = await getBoothMapFromDb(organizerId, eventId);
  if (!map) {
    return NextResponse.json({
      ok: true,
      eventId,
      layoutMode: 'grid',
      grid: [],
      streetFair: {},
      generatedBooths: [],
      assignments: [],
    });
  }

  const streetFair = JSON.parse(map.streetFairJson || '{}') as StreetFairLayoutDefinition;
  const layoutMode = (map.layoutMode || 'grid') as LayoutMode;

  return NextResponse.json({
    ok: true,
    dataSource: 'db',
    eventId,
    mapId: map.id,
    name: map.name,
    layoutMode,
    grid: JSON.parse(map.gridJson || '[]'),
    streetFair,
    assignments: map.assignments.map(a => ({
      boothLabel: a.boothLabel,
      applicationId: a.applicationId,
      vendorEmail: a.vendorEmail,
      vendorName: a.vendorName,
      utilities: JSON.parse(a.utilities || '[]'),
    })),
  });
}

/** PUT — update layout mode or street-fair definition */
export async function PUT(req: NextRequest) {
  await ensurePlatformSeed();

  const body = await req.json();
  const {
    organizerId = getActiveOrganizerId(),
    eventId,
    layoutMode,
    streetFair,
    grid,
  } = body as {
    organizerId?: string;
    eventId?: string;
    layoutMode?: LayoutMode;
    streetFair?: StreetFairLayoutDefinition;
    grid?: unknown[];
  };

  if (!eventId) {
    return NextResponse.json({ ok: false, error: 'eventId is required' }, { status: 400 });
  }

  if (getPilotDataSource() !== 'db') {
    const state = updateEventLayoutSeed(organizerId, eventId, {
      layoutMode,
      streetFair,
      grid: grid as import('@/components/organizer/booth-map-editor').BoothCell[] | undefined,
    });
    return NextResponse.json({
      ok: true,
      dataSource: 'seed',
      layoutMode: state.layoutMode,
      streetFair: state.streetFair,
      generatedBooths: state.generatedBooths,
      grid: state.grid,
    });
  }

  const map = await updateBoothLayoutDb({
    organizerId,
    eventId,
    layoutMode,
    streetFair,
    grid,
  });

  return NextResponse.json({ ok: true, dataSource: 'db', map });
}

/** POST — persist booth assignments */
export async function POST(req: NextRequest) {
  await ensurePlatformSeed();

  const body = await req.json();
  const {
    organizerId = getActiveOrganizerId(),
    eventId,
    assignments,
    actorLabel,
  } = body as {
    organizerId?: string;
    eventId?: string;
    assignments?: {
      boothLabel: string;
      applicationId?: string;
      vendorEmail: string;
      vendorName: string;
    }[];
    actorLabel?: string;
  };

  if (!eventId || !Array.isArray(assignments)) {
    return NextResponse.json(
      { ok: false, error: 'eventId and assignments[] are required' },
      { status: 400 }
    );
  }

  if (getPilotDataSource() !== 'db') {
    persistAssignmentsSeed(organizerId, eventId, assignments);
    const state = getEventLayoutSeed(organizerId, eventId);
    return NextResponse.json({
      ok: true,
      dataSource: 'seed',
      layoutMode: state.layoutMode,
      generatedBooths: state.generatedBooths,
    });
  }

  const map = await persistBoothAssignmentsDb({
    organizerId,
    eventId,
    assignments,
    actorLabel,
  });

  return NextResponse.json({ ok: true, map });
}
