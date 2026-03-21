'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  total: number;
  nightTotal: number;
  next7: number;
  next30: number;
  next90: number;
  newToday: number;
  njTotal: number;
  njNewToday: number;
  fireworksTotal: number;
  weekendTotal: number;
  lastScrape: string;
}

export default function EventsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/events/list?view=all')
      .then(r => r.json())
      .then(d => { setStats(d.stats); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: 'Total Events', value: stats.total, color: 'blue', href: '/events/all' },
    { label: 'Night Events', value: stats.nightTotal, color: 'amber', href: '/events/night', icon: '🌙' },
    { label: 'This Week', value: stats.next7, color: 'green', href: '/events/week' },
    { label: 'NJ Events', value: stats.njTotal, color: 'red', href: '/events/nj', icon: '🏖️' },
    { label: 'Fireworks', value: stats.fireworksTotal, color: 'rose', href: '/events/fireworks', icon: '🎆' },
    { label: 'Weekend Events', value: stats.weekendTotal, color: 'purple', href: '/events/weekend', icon: '🗓️' },
    { label: 'Next 30 Days', value: stats.next30, color: 'indigo' },
    { label: 'Next 90 Days', value: stats.next90, color: 'indigo' },
    { label: 'New Today', value: stats.newToday, color: 'rose' },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Event Tracker</h1>
            <p className="text-gray-400 mt-1">NY & NJ Street Fairs, Festivals, Fireworks & More</p>
          </div>
          <Link
            href="/events/scrape"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            Run Scrape
          </Link>
        </div>

        {loading ? (
          <div className="text-gray-500">Loading stats...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {cards.map(card => (
                <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  {card.href ? (
                    <Link href={card.href} className="block">
                      <div className="text-3xl font-bold">{card.icon || ''}{card.value}</div>
                      <div className="text-sm text-gray-400 mt-1">{card.label}</div>
                    </Link>
                  ) : (
                    <>
                      <div className="text-3xl font-bold">{card.value}</div>
                      <div className="text-sm text-gray-400 mt-1">{card.label}</div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="text-sm text-gray-400">Last Scrape: <span className="text-white">{stats?.lastScrape}</span></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Link href="/events/all" className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-600 transition-colors">
                <h3 className="font-semibold">All Events</h3>
                <p className="text-sm text-gray-400 mt-1">Full event list, sorted by date</p>
              </Link>
              <Link href="/events/night" className="bg-gray-900 border border-amber-900/50 rounded-xl p-5 hover:border-amber-600 transition-colors">
                <h3 className="font-semibold">🌙 Night Events</h3>
                <p className="text-sm text-gray-400 mt-1">Events starting 5 PM+ — best for LED sales</p>
              </Link>
              <Link href="/events/week" className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-green-600 transition-colors">
                <h3 className="font-semibold">This Week</h3>
                <p className="text-sm text-gray-400 mt-1">Events in the next 7 days</p>
              </Link>
              <Link href="/events/nj" className="bg-gray-900 border border-red-900/50 rounded-xl p-5 hover:border-red-600 transition-colors">
                <h3 className="font-semibold">🏖️ NJ Events</h3>
                <p className="text-sm text-gray-400 mt-1">All New Jersey events</p>
              </Link>
              <Link href="/events/fireworks" className="bg-gray-900 border border-rose-900/50 rounded-xl p-5 hover:border-rose-600 transition-colors">
                <h3 className="font-semibold">🎆 Fireworks</h3>
                <p className="text-sm text-gray-400 mt-1">Fireworks shows NY & NJ</p>
              </Link>
              <Link href="/events/weekend" className="bg-gray-900 border border-purple-900/50 rounded-xl p-5 hover:border-purple-600 transition-colors">
                <h3 className="font-semibold">🗓️ Weekend Events</h3>
                <p className="text-sm text-gray-400 mt-1">Saturday & Sunday events</p>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
