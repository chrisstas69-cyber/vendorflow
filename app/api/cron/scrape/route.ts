import { NextRequest, NextResponse } from 'next/server';
import { ALL_SCRAPERS } from '@/lib/scraper';
import { getDb, insertEvent, logScrape } from '@/lib/db';
import { makeEventId } from '@/lib/dedup';
import { isNightEvent } from '@/lib/night-detector';
import { detectEventType, detectIsWeekend } from '@/lib/event-tagger';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const results: { source: string; found: number; new: number; error?: string }[] = [];

  for (const scraper of ALL_SCRAPERS) {
    if (!scraper) continue;
    try {
      const { events, error } = await scraper.run();
      let newCount = 0;
      for (const event of events) {
        const eventId = makeEventId(event.title, event.event_date, event.location || null);
        const eventType = event.event_type || detectEventType(event.title, event.description);
        const isWeekend = detectIsWeekend(event.event_date);
        const { isNight } = isNightEvent(event.event_time || null, event.description);
        const finalIsNight = eventType === 'fireworks' || isNight;
        const isNew = insertEvent(db, {
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
      logScrape(db, scraper.name, events.length, newCount, error ? 'partial' : 'ok', error);
      results.push({ source: scraper.name, found: events.length, new: newCount, error });
    } catch (err) {
      results.push({ source: scraper.name, found: 0, new: 0, error: String(err) });
    }
  }

  return NextResponse.json({ success: true, results });
}
