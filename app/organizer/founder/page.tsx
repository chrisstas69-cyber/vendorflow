'use client';

import { useEffect, useState } from 'react';
import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { DEMO_ORGANIZER_ID } from '@/lib/platform-data';
import { Calendar, IdCard, Loader2, TrendingUp, Users } from 'lucide-react';

interface FounderMetrics {
  organizers: number;
  vendors: number;
  events: number;
  applications: number;
  activePassports: number;
  series: number;
}

export default function FounderMetricsPage() {
  const { card, heading, muted, pageTitle, statIcon } = useOrganizerTheme();
  const [metrics, setMetrics] = useState<FounderMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [inboxRes, passportRes] = await Promise.all([
        fetch(`/api/organizer/applications?organizerId=${DEMO_ORGANIZER_ID}`),
        fetch('/api/vendors/passport?email=vendor@demo.vendorflow.app'),
      ]);
      const inbox = await inboxRes.json();
      const passport = await passportRes.json();
      const emails = new Set((inbox.items ?? []).map((i: { vendorEmail: string }) => i.vendorEmail));

      setMetrics({
        organizers: 1,
        vendors: emails.size + 1,
        events: inbox.events?.length ?? 0,
        applications: inbox.items?.length ?? 0,
        activePassports: passport.passport ? 1 : 0,
        series: inbox.series?.length ?? 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  const stats = metrics
    ? [
        { label: 'Pilot organizers', value: metrics.organizers, icon: Users },
        { label: 'Unique vendors', value: metrics.vendors, icon: Users },
        { label: 'Events live', value: metrics.events, icon: Calendar },
        { label: 'Applications', value: metrics.applications, icon: TrendingUp },
        { label: 'Active passports', value: metrics.activePassports, icon: IdCard },
        { label: 'Seasons', value: metrics.series, icon: Calendar },
      ]
    : [];

  return (
    <OrganizerLayout>
      <div className="mb-6">
        <h1 className={`${pageTitle} ${heading}`}>Founder metrics</h1>
        <p className={`text-base mt-1 ${muted}`}>
          Long Island pilot traction — internal dashboard, not customer-facing.
        </p>
      </div>

      {loading ? (
        <div className={`flex items-center gap-2 ${muted}`}>
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map(stat => (
            <div key={stat.label} className={`rounded-xl border p-5 ${card}`}>
              <stat.icon className={`h-6 w-6 mb-3 ${statIcon}`} />
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className={`text-sm ${muted}`}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </OrganizerLayout>
  );
}
