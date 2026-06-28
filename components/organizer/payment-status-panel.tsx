'use client';

import Link from 'next/link';
import { CreditCard, FileSignature, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { getActiveOrganizerId } from '@/lib/pilot-config';

interface InvoiceSummary {
  totalInvoicedCents: number;
  totalPaidCents: number;
  outstandingCents: number;
  invoiceCount: number;
  paidCount: number;
}

export function PaymentStatusPanel({ compact }: { compact?: boolean }) {
  const { surface, muted, heading, sectionTitle, statIcon } = useOrganizerTheme();
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/payments/invoices?organizerId=${getActiveOrganizerId()}`);
    const data = await res.json();
    const invoices = data.invoices ?? [];
    const totalInvoicedCents = invoices.reduce(
      (s: number, i: { totalAmountCents: number }) => s + i.totalAmountCents,
      0
    );
    const totalPaidCents = invoices.reduce(
      (s: number, i: { payments: { status: string; amountCents: number }[] }) =>
        s +
        i.payments.filter(p => p.status === 'succeeded').reduce((a, p) => a + p.amountCents, 0),
      0
    );
    setSummary({
      totalInvoicedCents,
      totalPaidCents,
      outstandingCents: totalInvoicedCents - totalPaidCents,
      invoiceCount: invoices.length,
      paidCount: invoices.filter((i: { status: string }) => i.status === 'paid').length,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const body = loading ? (
    <div className={`flex items-center gap-2 text-sm ${muted}`}>
      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
    </div>
  ) : summary ? (
    <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'sm:grid-cols-3'}`}>
      <div>
        <div className={`flex items-center gap-2 text-xs ${muted} mb-1`}>
          <CreditCard className={`h-4 w-4 ${statIcon}`} /> Invoiced
        </div>
        <div className={`text-xl font-bold ${heading}`}>
          ${(summary.totalInvoicedCents / 100).toLocaleString()}
        </div>
      </div>
      <div>
        <div className={`flex items-center gap-2 text-xs ${muted} mb-1`}>
          <CreditCard className={`h-4 w-4 ${statIcon}`} /> Collected
        </div>
        <div className="text-xl font-bold text-emerald-600">
          ${(summary.totalPaidCents / 100).toLocaleString()}
        </div>
      </div>
      <div>
        <div className={`flex items-center gap-2 text-xs ${muted} mb-1`}>
          <FileSignature className={`h-4 w-4 ${statIcon}`} /> Outstanding
        </div>
        <div className={`text-xl font-bold ${heading}`}>
          ${(summary.outstandingCents / 100).toLocaleString()}
        </div>
      </div>
    </div>
  ) : (
    <p className={`text-sm ${muted}`}>No payment data yet.</p>
  );

  if (compact) {
    return (
      <section className={`rounded-2xl p-5 ${surface}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-semibold text-sm ${heading}`}>Payments</h3>
          <Link href="/organizer/invoicing" className="text-xs font-semibold text-teal-600 hover:underline">
            View all
          </Link>
        </div>
        {body}
      </section>
    );
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className={`${sectionTitle} ${heading}`}>Payments &amp; contracts</h2>
        <Link href="/organizer/invoicing" className="text-sm font-semibold text-teal-600 hover:underline">
          View all →
        </Link>
      </div>
      <div className={`rounded-2xl p-4 ${surface}`}>{body}</div>
    </section>
  );
}
