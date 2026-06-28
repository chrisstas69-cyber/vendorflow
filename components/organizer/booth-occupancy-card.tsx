'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';

export function BoothOccupancyCard({
  mapped = 0,
  approved = 0,
  totalBooths = 9,
}: {
  mapped?: number;
  approved?: number;
  totalBooths?: number;
}) {
  const { surface, muted, heading, statIcon } = useOrganizerTheme();
  const pct = totalBooths ? Math.round((mapped / totalBooths) * 100) : 0;

  return (
    <section className={`rounded-2xl p-5 ${surface}`}>
      <div className="flex items-center gap-2 mb-3">
        <MapPin className={`h-5 w-5 ${statIcon}`} />
        <h3 className={`font-semibold text-sm ${heading}`}>Booth occupancy</h3>
      </div>
      <div className="text-2xl font-bold">{mapped}/{totalBooths}</div>
      <p className={`text-xs mt-1 ${muted}`}>
        {approved - mapped > 0
          ? `${approved - mapped} approved vendor${approved - mapped !== 1 ? 's' : ''} unmapped`
          : 'All approved vendors mapped'}
      </p>
      <div className="mt-3 h-2 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
        <div className="h-full bg-teal-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <Link href="/organizer/booths" className="text-xs font-semibold text-teal-600 mt-3 inline-block hover:underline">
        Open booth map →
      </Link>
    </section>
  );
}
