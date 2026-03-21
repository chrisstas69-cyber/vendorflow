import { NextRequest, NextResponse } from 'next/server';
import { getDb, getEvents, getEventStats } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view') || 'all';
  const region = searchParams.get('region') || undefined;
  const eventType = searchParams.get('event_type') || undefined;

  const db = getDb();

  let events;
  switch (view) {
    case 'night':
      events = getEvents(db, { nightOnly: true, region });
      break;
    case 'week':
      events = getEvents(db, { daysAhead: 7, region });
      break;
    case 'month':
      events = getEvents(db, { daysAhead: 30, region });
      break;
    case 'new':
      events = getEvents(db, { newToday: true, region });
      break;
    case 'nj':
      events = getEvents(db, { region: 'NJ' });
      break;
    case 'nj-night':
      events = getEvents(db, { nightOnly: true, region: 'NJ' });
      break;
    case 'nj-new':
      events = getEvents(db, { newToday: true, region: 'NJ' });
      break;
    case 'fireworks':
      events = getEvents(db, { event_type: 'fireworks', region });
      break;
    case 'fireworks-ny':
      events = getEvents(db, { event_type: 'fireworks', region: 'Long Island' });
      break;
    case 'fireworks-nj':
      events = getEvents(db, { event_type: 'fireworks', region: 'NJ' });
      break;
    case 'weekend':
      events = getEvents(db, { isWeekend: true, region });
      break;
    default:
      events = getEvents(db, { region, event_type: eventType });
  }

  const stats = getEventStats(db);

  return NextResponse.json({ events, stats });
}
