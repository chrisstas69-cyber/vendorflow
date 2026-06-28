'use client';

import { useEventTimeline } from '@/hooks/use-event-timeline';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { OrganizerLoadingState } from '@/components/organizer/organizer-loading-state';
import { Calendar } from 'lucide-react';

export function EventTimelineCard({
  eventId,
  eventName,
}: {
  eventId: string | null;
  eventName?: string;
}) {
  const { stages, loading } = useEventTimeline(eventId);
  const { surface, muted, heading, sectionTitle, statIcon } = useOrganizerTheme();

  if (!eventId) {
    return (
      <div className={`rounded-2xl p-5 ${surface}`}>
        <p className={`text-sm ${muted}`}>Select an event to view its operational timeline.</p>
      </div>
    );
  }

  return (
    <section className={`rounded-2xl p-5 ${surface}`}>
      <div className="flex items-center gap-2 mb-4">
        <Calendar className={`h-5 w-5 ${statIcon}`} />
        <div>
          <h2 className={`${sectionTitle} ${heading}`}>Event timeline</h2>
          {eventName && <p className={`text-xs ${muted}`}>{eventName}</p>}
        </div>
      </div>

      {loading ? (
        <OrganizerLoadingState label="Loading timeline…" />
      ) : (
        <div className="overflow-x-auto pb-1 -mx-1 px-1">
          <div className="flex gap-2 min-w-max">
            {stages.map(stage => (
              <div
                key={stage.id}
                className={`shrink-0 w-28 rounded-lg px-2 py-2 text-center transition-colors ${
                  stage.status === 'complete'
                    ? 'bg-teal-600 text-white'
                    : stage.status === 'active'
                      ? 'bg-teal-100 text-teal-900 ring-2 ring-teal-500'
                      : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                  {stage.status === 'complete' ? 'Done' : stage.status === 'active' ? 'Now' : 'Next'}
                </div>
                <div className="text-xs font-semibold mt-0.5 leading-tight">{stage.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
