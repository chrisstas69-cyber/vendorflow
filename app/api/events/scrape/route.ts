import { NextRequest, NextResponse } from 'next/server';
import { ALL_SCRAPERS, getScraperByName, getScrapersByRegion } from '@/lib/scraper';
import { getDb, insertEvent, logScrape } from '@/lib/db';
import { makeEventId } from '@/lib/dedup';
import { isNightEvent } from '@/lib/night-detector';
import { detectEventType, detectIsWeekend } from '@/lib/event-tagger';
import { requireAdmin } from '@/lib/auth/guards';
import { persistScrapedEvents } from '@/lib/import/persist-scraped-events';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req); if (!auth.ok) return auth.response;
  const body = await req.json().catch(() => ({}));
  const sourceName = body.source as string | undefined;
  const regionFilter = body.region as string | undefined;

  const localDb = process.env.NODE_ENV === 'production' ? null : getDb();

  let scrapers;
  if (sourceName) {
    scrapers = [getScraperByName(sourceName)].filter(Boolean);
  } else if (regionFilter === 'NY' || regionFilter === 'NJ') {
    scrapers = getScrapersByRegion(regionFilter);
  } else {
    scrapers = ALL_SCRAPERS;
  }

  if (scrapers.length === 0) {
    return NextResponse.json({ error: `Unknown source: ${sourceName}` }, { status: 400 });
  }

  const results: { source: string; found: number; new: number; error?: string }[] = [];

  for (const scraper of scrapers) {
    if (!scraper) continue;
    const { events, error } = await scraper.run();

    if (process.env.NODE_ENV === 'production') {
      const persisted = await persistScrapedEvents(scraper.name, scraper.region, events);
      results.push({ source: scraper.name, found: events.length, new: persisted.created, error });
      continue;
    }
    if (!localDb) continue;

    let newCount = 0;
    for (const event of events) {
      const eventId = makeEventId(event.title, event.event_date, event.location || null);
      const eventType = event.event_type || detectEventType(event.title, event.description);
      const isWeekend = detectIsWeekend(event.event_date);
      const { isNight } = isNightEvent(event.event_time || null, event.description);
      const finalIsNight = eventType === 'fireworks' || isNight;

      const isNew = insertEvent(localDb, {
        event_id: eventId,
        title: event.title,
        event_date: event.event_date,
        event_time: event.event_time,
        location: event.location,
        town: event.town,
        county: event.county,
        source: event.source,
        url: event.url,
        description: event.description,
        is_night_event: finalIsNight ? 1 : 0,
        region: event.region || scraper.region,
        event_type: eventType,
        is_weekend: isWeekend ? 1 : 0,
      });
      if (isNew) newCount++;
    }

    logScrape(localDb, scraper.name, events.length, newCount, error ? 'error' : 'ok', error);
    results.push({ source: scraper.name, found: events.length, new: newCount, error });
  }

  const totalFound = results.reduce((s, r) => s + r.found, 0);
  const totalNew = results.reduce((s, r) => s + r.new, 0);

  return NextResponse.json({
    success: true,
    summary: { totalFound, totalNew, sourcesScraped: results.length },
    results,
  });
}
