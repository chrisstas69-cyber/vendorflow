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
  region: string;
}

export default function FireworksPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState('all');

  useEffect(() => {
    fetch('/api/events/list?view=fireworks')
      .then(r => r.json())
      .then(d => { setEvents(d.events || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = events.filter(e => {
    if (regionFilter === 'ny' && e.region === 'NJ') return false;
    if (regionFilter === 'nj' && e.region !== 'NJ') return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/events" className="text-blue-400 text-sm hover:underline">&larr; Dashboard</Link>
            <h1 className="text-2xl font-bold mt-1">🎆 Fireworks Shows</h1>
            <p className="text-gray-400 text-sm mt-1">Grucci, Zambelli, Melrose, PyroSpectaculars & more</p>
          </div>
          <select
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            value={regionFilter}
            onChange={e => setRegionFilter(e.target.value)}
          >
            <option value="all">All Regions</option>
            <option value="ny">NY Only</option>
            <option value="nj">NJ Only</option>
          </select>
        </div>

        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-500 text-center py-12">No fireworks events found yet.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(e => (
              <div key={e.id} className="bg-gray-900 border border-rose-900/30 rounded-xl p-4 flex justify-between items-start">
                <div>
                  <div className="font-semibold">
                    🎆 {e.url ? (
                      <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-rose-300 hover:underline">{e.title}</a>
                    ) : <span className="text-rose-300">{e.title}</span>}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {e.event_date}{e.event_time ? ` at ${e.event_time}` : ''} — {e.location || e.town || 'Location TBD'}
                    {e.county ? ` (${e.county})` : ''}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">{e.region}</span>
                  <span className="text-xs text-gray-600 bg-gray-800 px-2 py-1 rounded">{e.source}</span>
                </div>
              </div>
            ))}
            <div className="text-sm text-gray-500 mt-4">{filtered.length} fireworks events</div>
          </div>
        )}
      </div>
    </div>
  );
}
