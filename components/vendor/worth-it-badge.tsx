'use client';

import { computeWorthIt, WORTH_IT_STYLES, type WorthItRating } from '@/lib/worth-it';
import type { PlatformEvent } from '@/lib/platform-data';
import { TrendingUp } from 'lucide-react';

export function WorthItBadge({
  event,
  vendorCategory,
  compact,
}: {
  event: PlatformEvent;
  vendorCategory?: string;
  compact?: boolean;
}) {
  const result = computeWorthIt(event, vendorCategory);
  const style = WORTH_IT_STYLES[result.rating];

  if (compact) {
    return (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
        {result.label}
      </span>
    );
  }

  return (
    <div className={`rounded-lg border p-3 ${style.bg} ${style.border}`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className={`text-sm font-bold ${style.text}`}>{result.label}</span>
        <TrendingUp className={`h-4 w-4 ${style.text}`} />
      </div>
      <div className={`text-xs ${style.text} opacity-90`}>
        Est. ${result.bandMin.toLocaleString()}–${result.bandMax.toLocaleString()} net for vendors like you
      </div>
      {result.reasons.length > 0 && (
        <ul className={`text-[10px] mt-2 space-y-0.5 ${style.text} opacity-80`}>
          {result.reasons.map(r => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function worthItRating(event: PlatformEvent, vendorCategory?: string): WorthItRating {
  return computeWorthIt(event, vendorCategory).rating;
}
