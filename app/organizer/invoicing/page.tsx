'use client';

import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { OrganizerPageHeader } from '@/components/organizer/organizer-page-header';
import { InvoicingPanel } from '@/components/invoicing/invoicing-panel';
import { getActiveOrganizerId } from '@/lib/pilot-config';

export default function OrganizerInvoicingPage() {
  return (
    <OrganizerLayout>
      <OrganizerPageHeader
        title="Vendor booth fees"
        description="Invoices you send to vendors for booth space, permits, and deposits — vendors pay you."
      />
      <div className="mb-6 rounded-xl border border-amber-200/60 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
        <strong>Not payouts to vendors.</strong> This page tracks money vendors owe you for booth fees and
        related charges. When a vendor is approved, you can invoice them here; they pay through the link on
        their Vendor Hub invoicing tab.
      </div>
      <InvoicingPanel role="organizer" organizerId={getActiveOrganizerId()} />
    </OrganizerLayout>
  );
}
