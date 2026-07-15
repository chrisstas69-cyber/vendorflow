import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { getEffectiveDataSource } from '@/lib/pilot-config';
import { isHostedDatabaseUrl, prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST { eventId, kind: 'save'|'rsvp', active: boolean }
 * Hosted DB persists; seed mode acknowledges and relies on client localStorage counts.
 */
export async function POST(req: NextRequest) {
  await ensurePlatformSeed();
  const body = await req.json().catch(() => ({}));
  const eventId = String(body.eventId || '').trim();
  const kind = body.kind === 'rsvp' ? 'rsvp' : 'save';
  const active = Boolean(body.active);

  if (!eventId) {
    return NextResponse.json({ ok: false, error: 'eventId required' }, { status: 400 });
  }

  if (getEffectiveDataSource() !== 'db' || !isHostedDatabaseUrl()) {
    return NextResponse.json({
      ok: true,
      dataSource: 'seed',
      persisted: false,
      eventId,
      kind,
      active,
    });
  }

  try {
    const deviceId =
      req.headers.get('x-vf-device') ||
      req.cookies.get('vf_interest_device')?.value ||
      'anonymous';

    if (active) {
      await prisma.eventInterest.upsert({
        where: {
          eventId_deviceId_kind: { eventId, deviceId, kind },
        },
        create: { eventId, deviceId, kind },
        update: {},
      });
    } else {
      await prisma.eventInterest.deleteMany({
        where: { eventId, deviceId, kind },
      });
    }

    const [saves, rsvps] = await Promise.all([
      prisma.eventInterest.count({ where: { eventId, kind: 'save' } }),
      prisma.eventInterest.count({ where: { eventId, kind: 'rsvp' } }),
    ]);

    return NextResponse.json({
      ok: true,
      dataSource: 'db',
      persisted: true,
      counts: { saves, rsvps },
    });
  } catch (err) {
    console.warn('[interest] persist failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({
      ok: true,
      dataSource: 'seed',
      persisted: false,
      eventId,
      kind,
      active,
    });
  }
}

/** GET ?eventId= — public interest counts */
export async function GET(req: NextRequest) {
  await ensurePlatformSeed();
  const eventId = new URL(req.url).searchParams.get('eventId')?.trim();
  if (!eventId) {
    return NextResponse.json({ ok: false, error: 'eventId required' }, { status: 400 });
  }

  if (getEffectiveDataSource() !== 'db' || !isHostedDatabaseUrl()) {
    return NextResponse.json({
      ok: true,
      dataSource: 'seed',
      counts: { saves: 0, rsvps: 0 },
      note: 'Client localStorage holds pilot counts',
    });
  }

  try {
    const [saves, rsvps] = await Promise.all([
      prisma.eventInterest.count({ where: { eventId, kind: 'save' } }),
      prisma.eventInterest.count({ where: { eventId, kind: 'rsvp' } }),
    ]);
    return NextResponse.json({ ok: true, dataSource: 'db', counts: { saves, rsvps } });
  } catch {
    return NextResponse.json({ ok: true, dataSource: 'seed', counts: { saves: 0, rsvps: 0 } });
  }
}
