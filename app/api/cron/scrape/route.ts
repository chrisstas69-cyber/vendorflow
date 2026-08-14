import { NextRequest, NextResponse } from 'next/server';
import { ALL_SCRAPERS } from '@/lib/scraper';
import { getDb, insertEvent, logScrape } from '@/lib/db';
import { makeEventId } from '@/lib/dedup';
import { isNightEvent } from '@/lib/night-detector';
import { detectEventType, detectIsWeekend } from '@/lib/event-tagger';
import { requireCronSecret } from '@/lib/auth/guards';
import { persistScrapedEvents } from '@/lib/import/persist-scraped-events';

export async function GET(req: NextRequest) {
  const denied = requireCronSecret(req); if (denied) return denied;

  const localDb = process.env.NODE_ENV === 'production' ? null : getDb();
  const results: { source: string; found: number; new: number; error?: string }[] = [];

  for (const scraper of ALL_SCRAPERS) {
    if (!scraper) continue;
    try {
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
          source: scraper.name,
          url: event.url,
          description: event.description,
          is_night_event: finalIsNight ? 1 : 0,
          region: event.region || 'Long Island',
          event_type: eventType,
          is_weekend: isWeekend ? 1 : 0,
        });
        if (isNew) newCount++;
      }
      logScrape(localDb, scraper.name, events.length, newCount, error ? 'partial' : 'ok', error);
      results.push({ source: scraper.name, found: events.length, new: newCount, error });
    } catch (err) {
      results.push({ source: scraper.name, found: 0, new: 0, error: String(err) });
    }
  }

  return NextResponse.json({ success: true, results });
}
