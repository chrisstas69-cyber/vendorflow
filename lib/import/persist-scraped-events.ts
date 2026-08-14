import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { slugifyEvent } from '@/lib/public-events';
import type { ScrapedEvent } from '@/lib/scraper';

function stateFor(event: ScrapedEvent, scraperRegion: string): 'NY' | 'NJ' {
  const haystack = `${event.region ?? ''} ${scraperRegion} ${event.location ?? ''}`.toUpperCase();
  return haystack.includes('NJ') || haystack.includes('JERSEY') ? 'NJ' : 'NY';
}

export async function persistScrapedEvents(
  sourceName: string,
  scraperRegion: string,
  events: ScrapedEvent[]
) {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const event of events) {
    const startDate = /^\d{4}-\d{2}-\d{2}$/.test(event.event_date)
      ? new Date(`${event.event_date}T12:00:00Z`)
      : new Date(event.event_date);
    if (!event.title?.trim() || Number.isNaN(startDate.getTime())) {
      skipped += 1;
      continue;
    }
    const fingerprint = createHash('sha256')
      .update(`${sourceName}|${event.url ?? ''}|${event.title}|${event.event_date}`)
      .digest('hex')
      .slice(0, 10);
    const slug = `${slugifyEvent(event.title).slice(0, 70)}-${event.event_date}-${fingerprint}`;
    const existing = await prisma.publicEventListing.findUnique({ where: { slug }, select: { id: true } });
    const expiresAt = new Date(startDate.getTime() + 14 * 86400000);
    await prisma.publicEventListing.upsert({
      where: { slug },
      create: {
        slug,
        name: event.title.trim(),
        startDate,
        timeLabel: event.event_time ?? null,
        venueName: event.location?.trim() || event.town?.trim() || 'Venue to be confirmed',
        city: event.town?.trim() || event.county?.trim() || 'Location to be confirmed',
        state: stateFor(event, scraperRegion),
        description: event.description?.trim() || `Event information published by ${sourceName}. Confirm details with the original source before attending or applying.`,
        category: event.event_type || 'community-event',
        organizerName: 'Public source listing',
        sourceName,
        sourceUrl: event.url || null,
        status: event.url ? 'published' : 'pending',
        trustStatus: 'public_source',
        lastVerifiedAt: new Date(),
        publishedAt: event.url ? new Date() : null,
        expiresAt,
      },
      update: {
        name: event.title.trim(),
        startDate,
        timeLabel: event.event_time ?? null,
        venueName: event.location?.trim() || event.town?.trim() || 'Venue to be confirmed',
        city: event.town?.trim() || event.county?.trim() || 'Location to be confirmed',
        state: stateFor(event, scraperRegion),
        description: event.description?.trim() || undefined,
        category: event.event_type || 'community-event',
        sourceName,
        sourceUrl: event.url || null,
        status: event.url ? 'published' : 'pending',
        lastVerifiedAt: new Date(),
        expiresAt,
      },
    });
    if (existing) updated += 1; else created += 1;
  }
  return { created, updated, skipped };
}
