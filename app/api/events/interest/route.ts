import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { getEffectiveDataSource } from '@/lib/pilot-config';
import { isHostedDatabaseUrl, prisma } from '@/lib/prisma';
import { sendEventEmail } from '@/lib/public-events';
import { rateLimit } from '@/lib/auth/guards';
import { randomUUID } from 'crypto';

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

  if (!eventId || eventId.length > 160) {
    return NextResponse.json({ ok: false, error: 'eventId required' }, { status: 400 });
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`interest:${ip}`, 60, 60_000)) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
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
    const requestedDeviceId =
      req.headers.get('x-vf-device') ||
      req.cookies.get('vf_interest_device')?.value;
    const deviceId = requestedDeviceId && /^[a-zA-Z0-9_-]{8,100}$/.test(requestedDeviceId)
      ? requestedDeviceId
      : randomUUID();

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

    if (active && [10, 25, 50, 100].includes(saves + rsvps)) {
      const listing = await prisma.publicEventListing.findUnique({ where: { id: eventId } }).catch(() => null);
      if (listing?.organizerEmail && !listing.claimedByEmail) {
        const claimUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://vendorflow-mu.vercel.app'}/community-events/${listing.slug}`;
        await sendEventEmail(listing.organizerEmail, `${saves + rsvps} people are interested in ${listing.name}`, `<p>${saves + rsvps} people have saved or marked interest in your event.</p><p><a href="${claimUrl}">Claim the listing to manage vendor applications and see demand</a></p>`).catch(() => false);
      }
    }

    const response = NextResponse.json({
      ok: true,
      dataSource: 'db',
      persisted: true,
      counts: { saves, rsvps },
    });
    if (!requestedDeviceId) {
      response.cookies.set('vf_interest_device', deviceId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 365 * 24 * 60 * 60,
      });
    }
    return response;
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
