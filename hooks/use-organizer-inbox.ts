'use client';

import { useCallback, useEffect, useState } from 'react';
import type { OrganizerApplicationInboxItem } from '@/lib/organizer-schema';
import type { EventSeries, PlatformEvent } from '@/lib/platform-data';
import { DEMO_ORGANIZER_ID } from '@/lib/platform-data';
import type { InboxAction } from '@/lib/organizer-schema';

interface InboxCounts {
  scraped: number;
  applied: number;
  reviewing: number;
  approved: number;
  waitlisted: number;
}

interface SeasonMetrics {
  eventCount: number;
  applicationCount: number;
  approvedCount: number;
  docsCompletePct: number;
  projectedRevenueCents: number;
  openSlots: number;
}

interface InboxData {
  items: OrganizerApplicationInboxItem[];
  counts: InboxCounts;
  displayCounts?: Record<string, number>;
  seasonMetrics?: SeasonMetrics;
  series: EventSeries[];
  events: PlatformEvent[];
}

export function useOrganizerInbox(options?: {
  organizerId?: string;
  seriesId?: string;
  eventId?: string;
}) {
  const organizerId = options?.organizerId ?? DEMO_ORGANIZER_ID;
  const [data, setData] = useState<InboxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ organizerId });
      if (options?.seriesId) params.set('seriesId', options.seriesId);
      if (options?.eventId) params.set('eventId', options.eventId);
      const res = await fetch(`/api/organizer/applications?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load inbox');
      setData({
        items: json.items,
        counts: json.counts,
        displayCounts: json.displayCounts,
        seasonMetrics: json.seasonMetrics,
        series: json.series,
        events: json.events,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [organizerId, options?.seriesId, options?.eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const performAction = useCallback(
    async (submissionId: string, action: InboxAction) => {
      const res = await fetch('/api/organizer/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Action failed');
      await load();
      return json.message as string;
    },
    [load]
  );

  return { data, loading, error, reload: load, performAction };
}
