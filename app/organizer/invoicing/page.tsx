'use client';

import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { OrganizerPageHeader } from '@/components/organizer/organizer-page-header';
import { InvoicingPanel } from '@/components/invoicing/invoicing-panel';
import { getActiveOrganizerId } from '@/lib/pilot-config';

export default function OrganizerInvoicingPage() {
  return (
    <OrganizerLayout>
      <OrganizerPageHeader
        title="Payments & contracts"
        description="Booth fees, milestone contracts, and multi-party payment splits."
      />
      <InvoicingPanel role="organizer" organizerId={getActiveOrganizerId()} />
    </OrganizerLayout>
  );
}
