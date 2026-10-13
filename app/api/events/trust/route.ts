import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/auth/guards';
import { findPlatformEventById } from '@/lib/event-lookup';
import { getDb, type EventRow } from '@/lib/db';

export async function GET(req: NextRequest) {
  const eventId = new URL(req.url).searchParams.get('eventId');
  if (!eventId) return NextResponse.json({ ok: false, error: 'Event ID required.' }, { status: 400 });
  try {
    const approved = await prisma.eventClaim.findFirst({
      where: { externalEventId: eventId, status: 'approved' },
      select: { updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ ok: true, claimed: Boolean(approved), verifiedAt: approved?.updatedAt ?? null });
  } catch {
    return NextResponse.json({ ok: true, claimed: false, verifiedAt: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const listing = body.slug ? await prisma.publicEventListing.findUnique({ where: { slug: String(body.slug) } }) : null;
    const platformEvent = body.eventId ? findPlatformEventById(String(body.eventId)) : null;
    let scrapedEvent: EventRow | null = null;
    if (body.eventId && !platformEvent) {
      try { scrapedEvent = getDb().prepare('SELECT * FROM events WHERE event_id = ?').get(String(body.eventId)) as EventRow | undefined ?? null; } catch { scrapedEvent = null; }
    }
    if (!listing && !platformEvent && !scrapedEvent) return NextResponse.json({ ok: false, error: 'Event not found.' }, { status: 404 });
    const eventName = listing?.name ?? platformEvent?.name ?? scrapedEvent?.title;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (!rateLimit(`event-trust:${ip}`, 10, 60_000)) return NextResponse.json({ ok: false, error: 'Try again shortly.' }, { status: 429 });
    if (body.type === 'claim') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email ?? '')) || String(body.message ?? '').length > 2000 || String(body.evidenceUrl ?? '').length > 2048) return NextResponse.json({ ok: false, error: 'Valid claim details are required.' }, { status: 400 });
      await prisma.eventClaim.create({ data: { listingId: listing?.id, externalEventId: platformEvent?.id ?? scrapedEvent?.event_id, eventName, email: String(body.email).toLowerCase().trim(), role: body.role, evidenceUrl: body.evidenceUrl, note: body.message } });
      return NextResponse.json({ ok: true, message: 'Claim received. VendorFlow will verify your connection to the event.' });
    }
    if (!String(body.message ?? '').trim() || String(body.message).length > 2000) return NextResponse.json({ ok: false, error: 'Describe what needs correcting in 2,000 characters or fewer.' }, { status: 400 });
    await prisma.eventCorrection.create({ data: { listingId: listing?.id, externalEventId: platformEvent?.id ?? scrapedEvent?.event_id, eventName, email: body.email || null, message: String(body.message).trim() } });
    return NextResponse.json({ ok: true, message: 'Thank you. The correction is queued for review.' });
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Request failed.' }, { status: 500 }); }
}
