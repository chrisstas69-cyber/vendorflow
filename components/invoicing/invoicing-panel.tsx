'use client';

import { useCallback, useEffect, useState } from 'react';
import { InvoiceStatusBadge } from '@/components/invoicing/invoice-status-badge';
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
      <div className="flex items-center gap-2 text-sm text-gray-500 py-8 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading invoices…
      </div>
    );
  }

  if (invoices.length === 0) {
    return <p className="text-sm text-gray-500 py-6">No invoices yet.</p>;
  }

  return (
    <div className="space-y-4">
      {invoices.map(inv => {
        const paidCents = inv.payments
          .filter(p => p.status === 'succeeded')
          .reduce((s, p) => s + p.amountCents, 0);
        return (
          <div key={inv.id} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div>
                <div className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  {inv.invoiceNumber}
                </div>
                {role === 'organizer' && inv.vendorName && (
                  <div className="text-sm text-gray-500">{inv.vendorName}</div>
                )}
                {inv.eventId && <div className="text-xs text-gray-400 mt-0.5">Event {inv.eventId}</div>}
              </div>
              <InvoiceStatusBadge status={inv.status} />
            </div>
            <div className="text-2xl font-bold mb-2">${(inv.totalAmountCents / 100).toFixed(2)}</div>
            {inv.dueDate && (
              <p className="text-xs text-gray-500 mb-3">
                Due {new Date(inv.dueDate).toLocaleDateString()}
                {paidCents > 0 && ` · $${(paidCents / 100).toFixed(2)} paid`}
              </p>
            )}
            <ul className="text-sm text-gray-600 mb-4 space-y-1">
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 text-gray-900 font-semibold rounded-lg text-sm disabled:opacity-60"
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
