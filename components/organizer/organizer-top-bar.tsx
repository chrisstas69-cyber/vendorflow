'use client';

import Link from 'next/link';
import { Plus, UserPlus } from 'lucide-react';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { useOrganizerContext } from '@/contexts/organizer-context';
import type { EventSeries, PlatformEvent } from '@/lib/platform-data';

interface OrganizerTopBarProps {
  series: EventSeries[];
  events: PlatformEvent[];
}

export function OrganizerTopBar({ series, events }: OrganizerTopBarProps) {
  const { seriesId, eventId, setSeriesId, setEventId } = useOrganizerContext();
  const { btnPrimary, btnSecondary, muted, surface } = useOrganizerTheme();

  const filteredEvents = seriesId
    ? events.filter(e => e.seriesId === seriesId)
    : events;

  const selectedSeries = series.find(s => s.id === seriesId);
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={`rounded-2xl p-4 mb-6 ${surface}`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className={`text-xs font-medium uppercase tracking-wide ${muted}`}>Current season</div>
          <div className="text-lg font-semibold truncate">
            {selectedSeries?.name ?? 'All seasons'}
          </div>
          <div className={`text-sm ${muted}`}>
            {selectedSeries?.seasonLabel ?? '2026 pilot'} · {today}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={seriesId ?? ''}
            onChange={e => setSeriesId(e.target.value || null)}
            className={`text-sm rounded-lg border px-3 py-2 min-w-[180px] ${btnSecondary}`}
            aria-label="Select season"
          >
            <option value="">All seasons</option>
            {series.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={eventId ?? ''}
            onChange={e => setEventId(e.target.value || null)}
            className={`text-sm rounded-lg border px-3 py-2 min-w-[180px] ${btnSecondary}`}
            aria-label="Select event"
          >
            <option value="">All events</option>
            {filteredEvents.map(e => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <Link
            href="/organizer/events/new"
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm ${btnPrimary}`}
          >
            <Plus className="h-4 w-4" /> Create event
          </Link>
          <Link
            href="/organizer/applications"
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border ${btnSecondary}`}
          >
            <UserPlus className="h-4 w-4" /> Invite vendors
          </Link>
        </div>
      </div>
    </div>
  );
}
