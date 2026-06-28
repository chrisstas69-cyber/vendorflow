'use client';

import Link from 'next/link';
import { CreditCard, FileSignature, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { DEMO_ORGANIZER_ID } from '@/lib/platform-data';

interface InvoiceSummary {
  totalInvoicedCents: number;
  totalPaidCents: number;
  outstandingCents: number;
  invoiceCount: number;
  paidCount: number;
}

export function PaymentStatusPanel() {
  const { card, muted, heading, sectionTitle, statIcon, btnSecondary } = useOrganizerTheme();
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/payments/invoices?organizerId=${DEMO_ORGANIZER_ID}`);
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

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className={`${sectionTitle} ${heading}`}>Payments &amp; contracts</h2>
        <Link href="/organizer/invoicing" className={`text-sm font-semibold text-teal-600 hover:underline`}>
          View all →
        </Link>
      </div>
      <div className={`rounded-xl border p-4 ${card}`}>
        {loading ? (
          <div className={`flex items-center gap-2 text-sm ${muted}`}>
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : summary ? (
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <div className={`flex items-center gap-2 text-xs ${muted} mb-1`}>
                <CreditCard className={`h-4 w-4 ${statIcon}`} /> Invoiced
              </div>
              <div className="text-2xl font-bold">${(summary.totalInvoicedCents / 100).toLocaleString()}</div>
              <div className={`text-xs ${muted}`}>{summary.invoiceCount} invoices</div>
            </div>
            <div>
              <div className={`flex items-center gap-2 text-xs ${muted} mb-1`}>
                <CreditCard className={`h-4 w-4 ${statIcon}`} /> Collected
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                ${(summary.totalPaidCents / 100).toLocaleString()}
              </div>
              <div className={`text-xs ${muted}`}>{summary.paidCount} paid in full</div>
            </div>
            <div>
              <div className={`flex items-center gap-2 text-xs ${muted} mb-1`}>
                <FileSignature className={`h-4 w-4 ${statIcon}`} /> Outstanding
              </div>
              <div className="text-2xl font-bold">${(summary.outstandingCents / 100).toLocaleString()}</div>
              <div className={`text-xs ${muted}`}>Contracts tracked in demo mode</div>
            </div>
          </div>
        ) : (
          <p className={`text-sm ${muted}`}>No payment data yet.</p>
        )}
      </div>
    </section>
  );
}
