'use client';

import { History, TrendingUp } from 'lucide-react';
import { useVendorTheme } from '@/components/vendor/use-vendor-theme';
import type { EventDebriefRecord } from '@/lib/event-debrief-schema';
import { useEventDebrief } from '@/contexts/event-debrief-context';

interface PriorYearPanelProps {
  eventName: string;
  eventDate: string;
}

export function PriorYearPanel({ eventName, eventDate }: PriorYearPanelProps) {
  const { card, cardInset, muted } = useVendorTheme();
  const { getPriorYears } = useEventDebrief();
  const prior = getPriorYears(eventName, eventDate);

  if (!prior.length) return null;

  const avgNet = Math.round(
    prior.reduce((s, d) => s + (d.netProfit ?? 0), 0) / prior.filter(d => d.netProfit != null).length
  );

  return (
    <div className={`rounded-2xl border p-4 ${card} border-l-4 border-l-amber-400`}>
      <div className="flex items-center gap-2 mb-3">
        <History className="h-4 w-4 text-amber-500" />
        <span className="font-semibold text-sm">Same event — prior years</span>
      </div>

      {prior.some(d => d.netProfit != null) && (
        <div className={`text-xs mb-3 flex items-center gap-1 ${muted}`}>
          <TrendingUp className="h-3.5 w-3.5" />
          Avg net across {prior.length} past visit{prior.length > 1 ? 's' : ''}:{' '}
          <span className="font-semibold text-amber-600">${avgNet.toLocaleString()}</span>
        </div>
      )}

      <div className="space-y-2">
        {prior.slice(0, 3).map(entry => (
          <PriorYearCard key={entry.id} entry={entry} cardInset={cardInset} muted={muted} />
        ))}
      </div>
    </div>
  );
}

function PriorYearCard({
  entry,
  cardInset,
  muted,
}: {
  entry: EventDebriefRecord;
  cardInset: string;
  muted: string;
}) {
  const year = entry.eventDate.slice(0, 4);
  return (
    <div className={`rounded-xl p-3 text-sm ${cardInset}`}>
      <div className="flex justify-between gap-2 mb-1">
        <span className="font-semibold">{year}</span>
        {entry.netProfit != null && (
          <span className="text-amber-600 font-bold">${entry.netProfit.toLocaleString()} net</span>
        )}
      </div>
      {entry.weatherSummary && (
        <div className={`text-xs ${muted}`}>{entry.weatherSummary}</div>
      )}
      {entry.crowdRating && (
        <div className={`text-xs ${muted}`}>Crowd: {entry.crowdRating}/5</div>
      )}
      {entry.notes && (
        <p className={`text-xs mt-1 line-clamp-2 ${muted}`}>{entry.notes}</p>
      )}
      {entry.bringNextTime && (
        <p className="text-xs mt-1 text-amber-700 dark:text-amber-400">
          Tip: {entry.bringNextTime}
        </p>
      )}
    </div>
  );
}
