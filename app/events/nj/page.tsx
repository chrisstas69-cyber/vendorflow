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
  is_night_event: number;
  event_type: string | null;
}

export default function NJEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/events/list?view=nj')
      .then(r => r.json())
      .then(d => { setEvents(d.events || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = events.filter(e =>
    !search || e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.location || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/events" className="text-blue-400 text-sm hover:underline">&larr; Dashboard</Link>
            <h1 className="text-2xl font-bold mt-1">🏖️ New Jersey Events</h1>
          </div>
          <input
            type="text"
            placeholder="Search NJ events..."
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-500 text-center py-12">No NJ events found yet. Run a scrape to find events.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="text-left py-3 px-2">Date</th>
                  <th className="text-left py-3 px-2">Time</th>
                  <th className="text-left py-3 px-2 w-1">Night</th>
                  <th className="text-left py-3 px-2">Type</th>
                  <th className="text-left py-3 px-2">Event</th>
                  <th className="text-left py-3 px-2">Location</th>
                  <th className="text-left py-3 px-2">Source</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} className="border-b border-gray-900 hover:bg-gray-900/50">
                    <td className="py-2.5 px-2 whitespace-nowrap">{e.event_date}</td>
                    <td className="py-2.5 px-2 whitespace-nowrap text-gray-400">{e.event_time || '—'}</td>
                    <td className="py-2.5 px-2">{e.is_night_event ? '🌙' : ''}</td>
                    <td className="py-2.5 px-2 text-gray-400 text-xs">{e.event_type?.replace('_', ' ') || '—'}</td>
                    <td className="py-2.5 px-2">
                      {e.url ? (
                        <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{e.title}</a>
                      ) : e.title}
                    </td>
                    <td className="py-2.5 px-2 text-gray-400">{e.location || e.town || '—'}</td>
                    <td className="py-2.5 px-2 text-gray-500 text-xs">{e.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-sm text-gray-500 mt-4">{filtered.length} NJ events</div>
          </div>
        )}
      </div>
    </div>
  );
}
