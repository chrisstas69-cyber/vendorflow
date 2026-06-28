'use client';

import { useEffect, useState } from 'react';
import type { EventTimelineStageState } from '@/lib/workflow/timeline-stages';
import { defaultTimelineStages } from '@/lib/workflow/timeline-stages';
import { getActiveOrganizerId } from '@/lib/pilot-config';

export function useEventTimeline(eventId: string | null) {
  const [stages, setStages] = useState<EventTimelineStageState[]>([]);
  const [currentStage, setCurrentStage] = useState<string>('review');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setStages([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(
      `/api/organizer/timeline?organizerId=${getActiveOrganizerId()}&eventId=${encodeURIComponent(eventId)}`
    )
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;
        if (json.ok && json.stages?.length) {
          setStages(json.stages);
          setCurrentStage(json.currentStage);
        } else {
          setStages(defaultTimelineStages('review'));
          setCurrentStage('review');
        }
      })
      .catch(() => {
        if (!cancelled) setStages(defaultTimelineStages('review'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return { stages, currentStage, loading };
}
