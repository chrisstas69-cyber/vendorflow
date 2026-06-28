import { NextRequest, NextResponse } from 'next/server';
import { getActiveOrganizerId, getEffectiveDataSource } from '@/lib/pilot-config';
import {
  getActivityFeedFromDb,
  markActivityReadDb,
} from '@/lib/organizer-db-store';
import { ensurePlatformSeed } from '@/lib/platform-seed';

export const dynamic = 'force-dynamic';

/** GET — tenant-scoped activity feed */
export async function GET(req: NextRequest) {
  await ensurePlatformSeed();

  const { searchParams } = new URL(req.url);
  const organizerId = searchParams.get('organizerId') ?? getActiveOrganizerId();
  const unreadOnly = searchParams.get('unreadOnly') === '1';
  const limit = Number(searchParams.get('limit') ?? 50);

  if (getEffectiveDataSource() !== 'db') {
    return NextResponse.json({
      ok: true,
      dataSource: 'seed',
      items: [],
      unreadCount: 0,
      message: 'Set PILOT_DATA_SOURCE=db for persisted activity feed',
    });
  }

  const feed = await getActivityFeedFromDb(organizerId, { limit, unreadOnly });
  return NextResponse.json({ ok: true, dataSource: 'db', ...feed });
}

/** PATCH — mark feed items read */
export async function PATCH(req: NextRequest) {
  await ensurePlatformSeed();

  if (getEffectiveDataSource() !== 'db') {
    return NextResponse.json({ ok: false, error: 'Requires PILOT_DATA_SOURCE=db' }, { status: 400 });
  }

  const body = await req.json();
  const { organizerId = getActiveOrganizerId(), ids } = body as {
    organizerId?: string;
    ids?: string[];
  };

  if (!ids?.length) {
    return NextResponse.json({ ok: false, error: 'ids[] required' }, { status: 400 });
  }

  await markActivityReadDb(organizerId, ids);
  return NextResponse.json({ ok: true, marked: ids.length });
}
