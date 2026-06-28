'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { OrganizerPageHeader } from '@/components/organizer/organizer-page-header';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { Calendar, IdCard, Loader2, TrendingUp, Users, DollarSign } from 'lucide-react';

interface FounderMetricsResponse {
  metrics: {
    organizers: number;
    vendors: number;
    events: number;
    applications: number;
    activePassports: number;
    series: number;
    approvedVendors: number;
    projectedRevenueCents: number;
  };
  pilot: { dataSource: string; organizer: { organization: string; seasonLabel: string } };
  updatedAt: string;
}

export default function FounderMetricsPage() {
  const { card, muted, heading, statIcon } = useOrganizerTheme();
  const [data, setData] = useState<FounderMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/founder/metrics')
      .then(r => r.json())
      .then(json => {
        if (json.ok) setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const stats = data
    ? [
        { label: 'Pilot organizers', value: data.metrics.organizers, icon: Users },
        { label: 'Unique vendors', value: data.metrics.vendors, icon: Users },
        { label: 'Events live', value: data.metrics.events, icon: Calendar },
        { label: 'Applications', value: data.metrics.applications, icon: TrendingUp },
        { label: 'Approved vendors', value: data.metrics.approvedVendors, icon: Users },
        { label: 'Active passports', value: data.metrics.activePassports, icon: IdCard },
        { label: 'Seasons', value: data.metrics.series, icon: Calendar },
        {
          label: 'Projected revenue',
          value: `$${(data.metrics.projectedRevenueCents / 100).toLocaleString()}`,
          icon: DollarSign,
        },
      ]
    : [];

  return (
    <OrganizerLayout>
      <OrganizerPageHeader
        title="Founder metrics"
        description="Long Island pilot traction — internal dashboard, not customer-facing."
      />

      {data && (
        <p className={`text-sm mb-6 -mt-2 ${muted}`}>
          {data.pilot.organizer.organization} · {data.pilot.organizer.seasonLabel} ·{' '}
          {data.pilot.dataSource} data · updated {new Date(data.updatedAt).toLocaleString()}
        </p>
      )}

      {loading ? (
        <div className={`flex items-center gap-2 ${muted}`}>
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map(stat => (
              <div key={stat.label} className={`rounded-xl border p-5 ${card}`}>
                <stat.icon className={`h-6 w-6 mb-3 ${statIcon}`} />
                <div className={`text-3xl font-bold ${heading}`}>{stat.value}</div>
                <div className={`text-sm ${muted}`}>{stat.label}</div>
              </div>
            ))}
          </div>
          <Link href="/pricing" className="text-sm font-semibold text-teal-600 hover:underline">
            View pricing scaffolding →
          </Link>
        </>
      )}
    </OrganizerLayout>
  );
}
