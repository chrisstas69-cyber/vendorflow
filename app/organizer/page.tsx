'use client';

import { useState } from 'react';
import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { ApplicationPipelineBoard } from '@/components/organizer/application-pipeline-board';
import { OrganizerTopBar } from '@/components/organizer/organizer-top-bar';
import { SeasonOverviewPanel } from '@/components/organizer/season-overview-panel';
import { PaymentStatusPanel } from '@/components/organizer/payment-status-panel';
import { ComplianceChecklistPanel } from '@/components/organizer/compliance-checklist-panel';
import { EventTimelineCard } from '@/components/organizer/event-timeline-card';
import { ActivityFeedPanel } from '@/components/organizer/activity-feed-panel';
import { AttentionSummary } from '@/components/organizer/attention-summary';
import { BoothOccupancyCard } from '@/components/organizer/booth-occupancy-card';
import { OrganizerLoadingState } from '@/components/organizer/organizer-loading-state';
import { useOrganizerInbox } from '@/hooks/use-organizer-inbox';
import { useOrganizerContext } from '@/contexts/organizer-context';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { usePilotConfig } from '@/hooks/use-pilot-config';
import { useActivityFeed } from '@/hooks/use-activity-feed';

export default function OrganizerDashboardPage() {
  const { seriesId, eventId } = useOrganizerContext();
  const { organizer } = usePilotConfig();
  const { heading, sectionTitle } = useOrganizerTheme();
  const [toast, setToast] = useState('');
  const { reload: reloadActivity } = useActivityFeed({ limit: 1 });

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
    reloadActivity();
    return msg;
  };

  const timelineEventId = eventId ?? data?.events[0]?.id ?? null;
  const timelineEventName = data?.events.find(e => e.id === timelineEventId)?.name;
  const mapped = data?.displayCounts?.mapped ?? 0;
  const approved =
    (data?.displayCounts?.approved ?? 0) +
    (data?.displayCounts?.mapped ?? 0) +
    (data?.displayCounts?.paid ?? 0);

  return (
    <OrganizerLayout showBanners>
      {toast && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-800 text-sm font-medium">
          {toast}
        </div>
      )}

      {data && <OrganizerTopBar series={data.series} events={data.events} />}

      {data && (
        <div className="mb-6">
          <AttentionSummary items={data.items} displayCounts={data.displayCounts} />
        </div>
      )}

      {data?.seasonMetrics && (
        <div className="mb-6">
          <SeasonOverviewPanel metrics={data.seasonMetrics} compact />
        </div>
      )}

      <div className="mb-6">
        <EventTimelineCard eventId={timelineEventId} eventName={timelineEventName} />
      </div>

      <div className="grid xl:grid-cols-[1fr_320px] gap-6 mb-8">
        <section>
          <h2 className={`${sectionTitle} mb-4 ${heading}`}>Vendor pipeline</h2>
          {loading ? (
            <OrganizerLoadingState label="Loading pipeline…" />
          ) : error ? (
            <p className="text-red-600 text-sm">{error}</p>
          ) : data ? (
            <ApplicationPipelineBoard items={data.items} onAction={handleAction} />
          ) : null}
        </section>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <ActivityFeedPanel />
        </aside>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <PaymentStatusPanel compact />
        <ComplianceChecklistPanel
          compact
          category={data?.events.find(e => e.id === timelineEventId)?.category ?? 'festival'}
          region={organizer.region}
        />
        <BoothOccupancyCard mapped={mapped} approved={approved} />
      </div>
    </OrganizerLayout>
  );
}
