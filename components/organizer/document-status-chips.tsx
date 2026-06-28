'use client';

import { DOCUMENT_LABELS, type DocumentType } from '@/lib/documents';

const DOC_SHORT: Partial<Record<DocumentType, string>> = {
  coi: 'COI',
  w9: 'W-9',
  'booth-layout': 'Layout',
  'food-permit': 'Health',
  'vehicle-info': 'Vehicle',
  ce200: 'CE-200',
  other: 'Other',
};

export function DocumentStatusChips({
  missing,
  uploaded,
}: {
  missing: string[];
  uploaded: string[];
}) {
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {uploaded.map(type => (
        <span
          key={`ok-${type}`}
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
        >
          ✓ {DOC_SHORT[type as DocumentType] ?? type.toUpperCase()}
        </span>
      ))}
      {missing.map(type => (
        <span
          key={`miss-${type}`}
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300"
        >
          {DOC_SHORT[type as DocumentType] ?? DOCUMENT_LABELS[type as DocumentType]?.split('(')[0]?.trim() ?? type}
        </span>
      ))}
    </div>
  );
}

export function PaymentStatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
    partial: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
    invoiced: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
    none: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
  };
  const labels: Record<string, string> = {
    paid: 'Paid',
    partial: 'Partial',
    invoiced: 'Invoiced',
    none: 'Unpaid',
  };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${styles[status] ?? styles.none}`}>
      {labels[status] ?? status}
    </span>
  );
}

export function BoothChip({ boothId }: { boothId?: string }) {
  if (!boothId) return null;
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300">
      Booth {boothId}
    </span>
  );
}
