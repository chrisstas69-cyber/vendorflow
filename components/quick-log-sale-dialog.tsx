'use client';

import { useState } from 'react';
import { DollarSign, X } from 'lucide-react';
import type { FinancialRecord } from '@/lib/mock-data';
import { formatBookedEventLabel, type VendorBookedEvent } from '@/lib/vendor-booked-events';

interface QuickLogSaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<FinancialRecord, 'id'>) => void;
  bookedEvents: VendorBookedEvent[];
  initialEventId?: string;
}

export function QuickLogSaleDialog({
  isOpen,
  onClose,
  onSave,
  bookedEvents,
  initialEventId,
}: QuickLogSaleDialogProps) {
  const [eventId, setEventId] = useState(initialEventId ?? bookedEvents[0]?.id ?? '');
  const [gross, setGross] = useState('');
  const [expenses, setExpenses] = useState('');

  if (!isOpen) return null;

  const selected = bookedEvents.find(e => e.id === eventId) ?? bookedEvents[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const grossSales = parseFloat(gross) || 0;
    const expenseTotal = parseFloat(expenses) || 0;
    const netProfit = grossSales - expenseTotal;
    const margin = grossSales > 0 ? Math.round((netProfit / grossSales) * 100) : 0;
    onSave({
      eventId: selected.eventId,
      eventName: selected.name,
      date: selected.date || new Date().toISOString().slice(0, 10),
      grossSales,
      expenses: expenseTotal,
      netProfit,
      margin,
      breakEvenHour: '—',
      bestHour: '—',
      cashPercent: 50,
      cardPercent: 50,
    });
    onClose();
    setGross('');
    setExpenses('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close" />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-2xl border bg-white dark:bg-gray-900 p-6 shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-amber-500" /> Quick log sale
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="block text-sm mb-3">
          <span className="text-gray-500">Event</span>
          <select
            value={eventId}
            onChange={e => setEventId(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 bg-transparent text-sm"
          >
            {bookedEvents.map(ev => (
              <option key={ev.id} value={ev.id}>
                {formatBookedEventLabel(ev)}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm mb-3">
          <span className="text-gray-500">Gross sales ($)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={gross}
            onChange={e => setGross(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 bg-transparent"
          />
        </label>

        <label className="block text-sm mb-4">
          <span className="text-gray-500">Expenses ($)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={expenses}
            onChange={e => setExpenses(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 bg-transparent"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-xl py-3 bg-amber-400 text-gray-900 font-semibold"
        >
          Save to journal & logbook
        </button>
      </form>
    </div>
  );
}
