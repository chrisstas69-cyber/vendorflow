'use client';

import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { OrganizerPageHeader } from '@/components/organizer/organizer-page-header';
import { ComplianceChecklistPanel } from '@/components/organizer/compliance-checklist-panel';
import { useOrganizerContext } from '@/contexts/organizer-context';
import { usePilotConfig } from '@/hooks/use-pilot-config';
import { useOrganizerInbox } from '@/hooks/use-organizer-inbox';

export default function OrganizerCompliancePage() {
  const { eventId } = useOrganizerContext();
  const { organizer } = usePilotConfig();
  const { data } = useOrganizerInbox({ eventId: eventId ?? undefined });

  const selected = data?.events.find(e => e.id === eventId) ?? data?.events[0];
  const uploaded = (data?.items ?? [])
    .flatMap(i => i.uploadedDocTypes)
    .filter((v, idx, arr) => arr.indexOf(v) === idx);

  return (
    <OrganizerLayout showBanners={false}>
      <OrganizerPageHeader
        title="Compliance"
        description={`Location-aware document requirements for ${organizer.organization}.`}
      />
      <ComplianceChecklistPanel
        category={selected?.category ?? 'festival'}
        region={organizer.region}
        uploadedDocTypes={uploaded}
      />
    </OrganizerLayout>
  );
}
