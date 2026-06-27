import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createLead, findLeadByNameAndDate, LEAD_FIELDS } from '@/lib/airtable';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventId = body.eventId as number | undefined;
    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 });
    }

    const db = getDb();
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as {
      id: number;
      title: string;
      event_date: string;
      event_time: string | null;
      location: string | null;
      town: string | null;
      county: string | null;
      source: string;
      url: string | null;
      event_id: string;
    } | undefined;

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const existing = await findLeadByNameAndDate(event.title, event.event_date);
    if (existing) {
      return NextResponse.json({ success: true, duplicate: true, record: existing });
    }

    const location = [event.town, event.county, event.location].filter(Boolean).join(', ');
    const record = await createLead({
      [LEAD_FIELDS.eventName]: event.title,
      [LEAD_FIELDS.eventDate]: event.event_date,
      [LEAD_FIELDS.status]: 'Discovered',
      [LEAD_FIELDS.location]: location || undefined,
      [LEAD_FIELDS.sourceUrl]: event.url || undefined,
      [LEAD_FIELDS.scraperSource]: event.source,
      [LEAD_FIELDS.sqliteEventId]: event.event_id,
    });

    return NextResponse.json({ success: true, record });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
