import type { InvoiceStatus } from '@/lib/payments/types';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_STYLES } from '@/lib/payments/types';

export function InvoiceStatusBadge({ status }: { status: string }) {
  const key = (status as InvoiceStatus) in INVOICE_STATUS_LABELS ? (status as InvoiceStatus) : 'draft';
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${INVOICE_STATUS_STYLES[key]}`}>
      {INVOICE_STATUS_LABELS[key]}
    </span>
  );
}
