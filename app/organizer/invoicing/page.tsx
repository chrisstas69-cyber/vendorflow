'use client';

import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { InvoicingPanel } from '@/components/invoicing/invoicing-panel';
import { DEMO_ORGANIZER_ID } from '@/lib/platform-data';

export default function OrganizerInvoicingPage() {
  return (
    <OrganizerLayout>
      <h1 className="text-2xl font-bold mb-1">Invoicing & Contracts</h1>
      <p className="text-gray-600 text-sm mb-6">
        Booth fees, milestone contracts, and multi-party payment splits
      </p>
      <InvoicingPanel role="organizer" organizerId={DEMO_ORGANIZER_ID} />
    </OrganizerLayout>
  );
}
