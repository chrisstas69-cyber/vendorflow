'use client';

import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { BoothPlanningShell } from '@/components/organizer/booth-planning-shell';
import { OrganizerPageHeader } from '@/components/organizer/organizer-page-header';
import { useOrganizerContext } from '@/contexts/organizer-context';
import { useOrganizerInbox } from '@/hooks/use-organizer-inbox';

export default function OrganizerBoothsPage() {
  const { eventId, setEventId } = useOrganizerContext();
  const { data } = useOrganizerInbox();
  const events = data?.events ?? [];
  const selected = eventId ?? events[0]?.id ?? 'evt-001';

  return (
    <OrganizerLayout showBanners={false}>
      <OrganizerPageHeader
        title="Booths"
        description="Quick Grid or Street Fair Mode — assign approved vendors to booth spaces."
        actions={
          events.length > 0 ? (
            <select
              value={selected}
              onChange={e => setEventId(e.target.value)}
              className="text-sm rounded-lg border px-3 py-2 border-stone-200 bg-white"
              aria-label="Select event for booth map"
            >
              {events.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          ) : undefined
        }
      />
      <BoothPlanningShell eventId={selected} />
    </OrganizerLayout>
  );
}
