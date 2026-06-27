'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Event {
  id: number;
  title: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  town: string | null;
  county: string | null;
  url: string | null;
  is_night_event: number;
  region: string;
  event_type: string | null;
  source: string;
}

export default function WeekendEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/events/list?view=weekend')
      .then(r => r.json())
      .then(d => { setEvents(d.events || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Link href="/events" className="text-blue-400 text-sm hover:underline">&larr; Dashboard</Link>
        <h1 className="text-2xl font-bold mt-2 mb-1">🗓️ Weekend Events</h1>
        <p className="text-gray-400 text-sm mb-6">Saturday & Sunday events — NY & NJ</p>

        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : events.length === 0 ? (
          <div className="text-gray-500 text-center py-12">No weekend events found yet.</div>
        ) : (
          <div className="space-y-3">
            {events.map(e => {
              const d = new Date(e.event_date + 'T12:00:00');
              const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
              return (
                <div key={e.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs text-purple-400 font-medium">{dayName}, {e.event_date} — {e.region}</div>
                      <div className="font-semibold mt-1">
                        {e.is_night_event ? '🌙 ' : ''}{e.event_type === 'fireworks' ? '🎆 ' : ''}
                        {e.url ? (
                          <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-400">{e.title}</a>
                        ) : e.title}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {e.event_time ? `${e.event_time} — ` : ''}{e.location || e.town || 'Location TBD'}
                        {e.county ? ` (${e.county})` : ''}
                        {e.event_type ? ` [${e.event_type.replace('_', ' ')}]` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="text-sm text-gray-500 mt-4">{events.length} weekend events</div>
          </div>
        )}
      </div>
    </div>
  );
}
