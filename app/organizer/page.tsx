'use client';

import { useState } from 'react';
import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { ApplicationPipelineBoard } from '@/components/organizer/application-pipeline-board';
import { OrganizerTopBar } from '@/components/organizer/organizer-top-bar';
import { SeasonOverviewPanel } from '@/components/organizer/season-overview-panel';
import { PaymentStatusPanel } from '@/components/organizer/payment-status-panel';
import { ComplianceChecklistPanel } from '@/components/organizer/compliance-checklist-panel';
import { useOrganizerInbox } from '@/hooks/use-organizer-inbox';
import { useOrganizerContext } from '@/contexts/organizer-context';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { Loader2 } from 'lucide-react';

export default function OrganizerDashboardPage() {
  const { seriesId, eventId } = useOrganizerContext();
  const { heading, muted, pageTitle } = useOrganizerTheme();
  const [toast, setToast] = useState('');
  const { data, loading, error, performAction } = useOrganizerInbox({
    seriesId: seriesId ?? undefined,
    eventId: eventId ?? undefined,
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

  const selectedEvent = data?.events.find(e => e.id === eventId);

  return (
    <OrganizerLayout>
      <div className="mb-6">
        <h1 className={`${pageTitle} ${heading}`}>Season dashboard</h1>
        <p className={`text-base mt-1 ${muted}`}>
          Your vendor pipeline, compliance, and revenue at a glance.
        </p>
      </div>

      {toast && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-800 text-sm font-medium">
          {toast}
        </div>
      )}

      {data && (
        <OrganizerTopBar series={data.series} events={data.events} />
      )}

      {data?.seasonMetrics && <SeasonOverviewPanel metrics={data.seasonMetrics} />}

      <PaymentStatusPanel />

      <section className="mb-8">
        <h2 className={`text-lg font-semibold mb-3 ${heading}`}>Vendor pipeline</h2>
        {loading ? (
          <div className={`flex items-center justify-center gap-2 py-16 ${muted}`}>
            <Loader2 className="h-5 w-5 animate-spin" /> Loading pipeline…
          </div>
        ) : error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : data ? (
          <ApplicationPipelineBoard items={data.items} onAction={handleAction} />
        ) : null}
      </section>

      <ComplianceChecklistPanel
        category={selectedEvent?.category ?? 'festival'}
        region="nassau"
        uploadedDocTypes={[]}
      />
    </OrganizerLayout>
  );
}
