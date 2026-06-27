'use client';

import type { EventSeries } from '@/lib/platform-data';

interface SeriesOverviewProps {
  series: EventSeries[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function SeriesOverview({ series, selectedId, onSelect }: SeriesOverviewProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
          selectedId === null
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300'
        }`}
      >
        All series
      </button>
      {series.map(s => (
        <button
          key={s.id}
          type="button"
          onClick={() => onSelect(s.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors text-left ${
            selectedId === s.id
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300'
          }`}
        >
          <div>{s.name}</div>
          <div className={`text-xs ${selectedId === s.id ? 'text-indigo-200' : 'text-gray-500'}`}>
            {s.seasonLabel} · {s.eventIds.length} events
          </div>
        </button>
      ))}
    </div>
  );
}
