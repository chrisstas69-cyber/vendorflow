import { NextRequest, NextResponse } from 'next/server';
import { getActiveOrganizerId, getPilotDataSource } from '@/lib/pilot-config';
import {
  getBoothMapFromDb,
  persistBoothAssignmentsDb,
} from '@/lib/organizer-db-store';
import { ensurePlatformSeed } from '@/lib/platform-seed';

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
    return NextResponse.json({
      ok: true,
      dataSource: 'seed',
      message: 'Set PILOT_DATA_SOURCE=db to persist booth assignments',
      eventId,
      grid: [],
      assignments: [],
    });
  }

  const map = await getBoothMapFromDb(organizerId, eventId);
  if (!map) {
    return NextResponse.json({ ok: true, eventId, grid: [], assignments: [] });
  }

  return NextResponse.json({
    ok: true,
    dataSource: 'db',
    eventId,
    mapId: map.id,
    name: map.name,
    grid: JSON.parse(map.gridJson || '[]'),
    assignments: map.assignments.map(a => ({
      boothLabel: a.boothLabel,
      applicationId: a.applicationId,
      vendorEmail: a.vendorEmail,
      vendorName: a.vendorName,
      utilities: JSON.parse(a.utilities || '[]'),
    })),
  });
}

/** POST — persist booth assignments */
export async function POST(req: NextRequest) {
  await ensurePlatformSeed();

  if (getPilotDataSource() !== 'db') {
    return NextResponse.json(
      { ok: false, error: 'Booth persistence requires PILOT_DATA_SOURCE=db' },
      { status: 400 }
    );
  }

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

  const map = await persistBoothAssignmentsDb({
    organizerId,
    eventId,
    assignments,
    actorLabel,
  });

  return NextResponse.json({ ok: true, map });
}
