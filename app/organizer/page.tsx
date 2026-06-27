'use client';

import { useState } from 'react';
import Link from 'next/link';
import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { ApplicationPipelineBoard } from '@/components/organizer/application-pipeline-board';
import { SeriesOverview } from '@/components/organizer/series-overview';
import { useOrganizerInbox } from '@/hooks/use-organizer-inbox';
import { DEMO_ORGANIZER_ID } from '@/lib/platform-data';
import { Calendar, Eye, FileText, Loader2, Plus, Users } from 'lucide-react';

export default function OrganizerDashboardPage() {
  const [seriesId, setSeriesId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const { data, loading, error, performAction } = useOrganizerInbox({
    organizerId: DEMO_ORGANIZER_ID,
    seriesId: seriesId ?? undefined,
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleAction = async (submissionId: string, action: Parameters<typeof performAction>[1]) => {
    const msg = await performAction(submissionId, action);
    showToast(msg);
    return msg;
  };

  const events = data?.events ?? [];
  const counts = data?.counts;
  const totalViews = events.reduce((s, e) => s + e.views, 0);
  const pendingApps = (counts?.applied ?? 0) + (counts?.reviewing ?? 0) + (counts?.scraped ?? 0);

  return (
    <OrganizerLayout>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Applications Pipeline</h1>
          <p className="text-gray-600 text-sm">
            Kanban inbox across seasons — demo organizer <code className="text-xs bg-gray-100 px-1 rounded">org-demo</code>
          </p>
        </div>
        <Link
          href="/organizer/events/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-sm shrink-0"
        >
          <Plus className="h-4 w-4" /> Create Event
        </Link>
      </div>

      {toast && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-green-100 text-green-800 text-sm font-medium">{toast}</div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'My Events', value: events.length, icon: Calendar },
          { label: 'In Pipeline', value: pendingApps, icon: FileText },
          { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye },
          {
            label: 'Open Slots',
            value: events.reduce((s, e) => s + (e.vendorSlots - e.vendorSlotsFilled), 0),
            icon: Users,
          },
        ].map(stat => (
          <div key={stat.label} className="p-4 rounded-xl bg-white border border-gray-200">
            <stat.icon className="h-5 w-5 text-indigo-600 mb-2" />
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {data?.series && (
        <SeriesOverview series={data.series} selectedId={seriesId} onSelect={setSeriesId} />
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading pipeline…
        </div>
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : data ? (
        <ApplicationPipelineBoard items={data.items} onAction={handleAction} />
      ) : null}

      <div className="mt-8 flex gap-3">
        <Link
          href="/organizer/applications"
          className="text-sm font-semibold text-indigo-600 hover:underline"
        >
          Full applications list →
        </Link>
        <Link href="/organizer/invoicing" className="text-sm font-semibold text-indigo-600 hover:underline">
          Invoicing →
        </Link>
      </div>
    </OrganizerLayout>
  );
}
