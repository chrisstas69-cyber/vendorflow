'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export function MatchScoreBadge({ vendorEmail, eventId }: { vendorEmail: string; eventId: string }) {
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(
        `/api/intel/match?vendorEmail=${encodeURIComponent(vendorEmail)}&eventId=${encodeURIComponent(eventId)}`
      );
      const data = await res.json();
      if (!cancelled && data.ok) setScore(data.match.score);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [vendorEmail, eventId]);

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
        <Loader2 className="h-3 w-3 animate-spin" />
      </span>
    );
  }

  if (score === null) return null;

  const color = score >= 90 ? 'text-green-700 bg-green-50' : score >= 75 ? 'text-indigo-700 bg-indigo-50' : 'text-amber-700 bg-amber-50';

  return (
    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>
      {score}% match
    </span>
  );
}
