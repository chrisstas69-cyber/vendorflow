'use client';

import { useCallback, useEffect, useState } from 'react';
import { InvoiceStatusBadge } from '@/components/invoicing/invoice-status-badge';
import { useVendorTheme } from '@/components/vendor/use-vendor-theme';
import { CreditCard, FileText, Loader2 } from 'lucide-react';

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmountCents: number;
  dueDate: string | null;
  eventId: string | null;
  vendorName?: string;
  vendorEmail?: string;
  lineItems: { label: string; amountCents: number }[];
  payments: { id: string; status: string; amountCents: number }[];
}

export interface InvoicingPanelProps {
  role: 'organizer' | 'vendor';
  organizerId?: string;
  vendorEmail?: string;
}

export function InvoicingPanel({ role, organizerId, vendorEmail }: InvoicingPanelProps) {
  const { card, cardInset, muted, heading, btnPrimary } = useVendorTheme();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (role === 'organizer' && organizerId) params.set('organizerId', organizerId);
    if (role === 'vendor' && vendorEmail) params.set('vendorEmail', vendorEmail);
    const res = await fetch(`/api/payments/invoices?${params}`);
    const data = await res.json();
    setInvoices(data.invoices ?? []);
    setLoading(false);
  }, [role, organizerId, vendorEmail]);

  useEffect(() => {
    load();
  }, [load]);

  const startCheckout = async (invoiceId: string) => {
    setPayingId(invoiceId);
    const base = window.location.origin;
    const res = await fetch('/api/payments/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoiceId,
        milestoneId: 'deposit',
        successUrl: `${base}${role === 'vendor' ? '/vendor' : '/organizer'}?paid=1`,
        cancelUrl: `${base}${role === 'vendor' ? '/vendor' : '/organizer'}`,
      }),
    });
    const data = await res.json();
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    } else {
      setPayingId(null);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-sm py-8 justify-center ${muted}`}>
        <Loader2 className="h-4 w-4 animate-spin" /> Loading invoices…
      </div>
    );
  }

  if (invoices.length === 0) {
    return <p className={`text-sm py-6 ${muted}`}>No invoices yet.</p>;
  }

  return (
    <div className="space-y-4">
      {invoices.map(inv => {
        const paidCents = inv.payments
          .filter(p => p.status === 'succeeded')
          .reduce((s, p) => s + p.amountCents, 0);
        return (
          <div key={inv.id} className={`rounded-xl border p-4 ${cardInset}`}>
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div>
                <div className={`font-semibold flex items-center gap-2 ${heading}`}>
                  <FileText className={`h-4 w-4 ${muted}`} />
                  {inv.invoiceNumber}
                </div>
                {role === 'organizer' && inv.vendorName && (
                  <div className={`text-sm ${muted}`}>{inv.vendorName}</div>
                )}
                {inv.eventId && <div className={`text-xs mt-0.5 ${muted}`}>Event {inv.eventId}</div>}
              </div>
              <InvoiceStatusBadge status={inv.status} />
            </div>
            <div className={`text-2xl font-bold mb-2 ${heading}`}>
              ${(inv.totalAmountCents / 100).toFixed(2)}
            </div>
            {inv.dueDate && (
              <p className={`text-xs mb-3 ${muted}`}>
                Due {new Date(inv.dueDate).toLocaleDateString()}
                {paidCents > 0 && ` · $${(paidCents / 100).toFixed(2)} paid`}
              </p>
            )}
            <ul className={`text-sm mb-4 space-y-1 ${muted}`}>
              {inv.lineItems.map(li => (
                <li key={li.label} className="flex justify-between">
                  <span>{li.label}</span>
                  <span>${(li.amountCents / 100).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            {role === 'vendor' && inv.status !== 'paid' && inv.status !== 'void' && (
              <button
                type="button"
                disabled={payingId === inv.id}
                onClick={() => startCheckout(inv.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm disabled:opacity-60 ${btnPrimary}`}
              >
                {payingId === inv.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Pay deposit
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
