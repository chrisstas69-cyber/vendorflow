'use client';

import Link from 'next/link';
import { FlaskConical } from 'lucide-react';
import { usePilotConfig } from '@/hooks/use-pilot-config';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';

export function PilotModeBanner() {
  const { enabled, dataSource, organizer, loading } = usePilotConfig();
  const { card, muted } = useOrganizerTheme();

  if (loading || !enabled || !organizer?.organization) return null;

  return (
    <div
      className={`rounded-lg border px-3 py-2 mb-4 flex flex-wrap items-center justify-between gap-2 text-sm ${card}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <FlaskConical className="h-4 w-4 text-teal-600 shrink-0" />
        <span className="font-medium truncate">{organizer.organization}</span>
        <span className={`text-xs ${muted}`}>
          · {organizer.seasonLabel} · {dataSource === 'seed' ? 'Seed data' : 'Database'}
        </span>
      </div>
      <Link href="/organizer/founder" className="text-xs font-semibold text-teal-600 hover:underline shrink-0">
        Founder metrics →
      </Link>
    </div>
  );
}
