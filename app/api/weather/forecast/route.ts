import { NextRequest, NextResponse } from 'next/server';
import { fetchWeatherForDate } from '@/lib/weather-forecast';
import { resolveEventLocation } from '@/lib/event-location';

/** GET — forecast snapshot for event date + location */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const eventId = searchParams.get('eventId') ?? undefined;
  const eventName = searchParams.get('eventName') ?? undefined;
  const query = searchParams.get('query') ?? undefined;

  if (!date) {
    return NextResponse.json({ ok: false, error: 'date required (YYYY-MM-DD)' }, { status: 400 });
  }

  const loc = query
    ? { query, label: query, city: '', state: '' }
    : resolveEventLocation(eventId, eventName);

  try {
    const weather = await fetchWeatherForDate(loc.query, date);
    if (!weather) {
      return NextResponse.json({ ok: false, error: 'Forecast unavailable' }, { status: 502 });
    }
    return NextResponse.json({ ok: true, location: loc.label, weather });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Weather fetch failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
