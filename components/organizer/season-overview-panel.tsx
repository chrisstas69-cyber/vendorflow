'use client';

import { Calendar, CheckCircle2, DollarSign, FileCheck, Users } from 'lucide-react';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';

export interface SeasonMetrics {
  eventCount: number;
  applicationCount: number;
  approvedCount: number;
  docsCompletePct: number;
  projectedRevenueCents: number;
  openSlots: number;
}

export function SeasonOverviewPanel({
  metrics,
  compact,
}: {
  metrics: SeasonMetrics;
  compact?: boolean;
}) {
  const { surface, muted, heading, statIcon, sectionTitle } = useOrganizerTheme();

  const stats = [
    { label: 'Events', value: metrics.eventCount, icon: Calendar },
    { label: 'Applications', value: metrics.applicationCount, icon: Users },
    { label: 'Approved', value: metrics.approvedCount, icon: CheckCircle2 },
    { label: 'Docs complete', value: `${metrics.docsCompletePct}%`, icon: FileCheck },
    {
      label: 'Projected revenue',
      value: `$${(metrics.projectedRevenueCents / 100).toLocaleString()}`,
      icon: DollarSign,
    },
    { label: 'Open slots', value: metrics.openSlots, icon: Users },
  ];

  return (
    <section className={compact ? '' : 'mb-6'}>
      {!compact && <h2 className={`${sectionTitle} mb-3 ${heading}`}>Season overview</h2>}
      <div
        className={`grid gap-3 ${
          compact ? 'grid-cols-3 md:grid-cols-6' : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6'
        }`}
      >
        {stats.map(stat => (
          <div key={stat.label} className={`rounded-xl p-3 ${surface}`}>
            <stat.icon className={`h-4 w-4 mb-1.5 ${statIcon}`} />
            <div className={`text-lg font-bold ${heading}`}>{stat.value}</div>
            <div className={`text-[11px] ${muted}`}>{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
