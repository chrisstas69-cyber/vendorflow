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
  source: string;
  url: string | null;
}

export default function NightEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/events/list?view=night')
      .then(r => r.json())
      .then(d => { setEvents(d.events || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Link href="/events" className="text-blue-400 text-sm hover:underline">&larr; Dashboard</Link>
        <h1 className="text-2xl font-bold mt-2 mb-1">🌙 Night Events</h1>
        <p className="text-gray-400 text-sm mb-6">Events starting at 5 PM or later — your best LED toy selling opportunities</p>

        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : events.length === 0 ? (
          <div className="text-gray-500 text-center py-12">No night events found yet.</div>
        ) : (
          <div className="space-y-3">
            {events.map(e => (
              <div key={e.id} className="bg-gray-900 border border-amber-900/30 rounded-xl p-4 flex justify-between items-start">
                <div>
                  <div className="font-semibold">
                    🌙 {e.url ? (
                      <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-amber-300 hover:underline">{e.title}</a>
                    ) : <span className="text-amber-300">{e.title}</span>}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {e.event_date}{e.event_time ? ` at ${e.event_time}` : ''} — {e.location || e.town || 'Location TBD'}
                    {e.county ? ` (${e.county})` : ''}
                  </div>
                </div>
                <span className="text-xs text-gray-600 bg-gray-800 px-2 py-1 rounded">{e.source}</span>
              </div>
            ))}
            <div className="text-sm text-gray-500 mt-4">{events.length} night events</div>
          </div>
        )}
      </div>
    </div>
  );
}
