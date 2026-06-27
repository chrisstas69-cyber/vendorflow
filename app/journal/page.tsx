'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { PaymentUploadDialog } from '@/components/payment-upload-dialog';
import { useVendorTheme } from '@/components/vendor/use-vendor-theme';
import { useDemoStore } from '@/contexts/demo-store-context';
import { TrendingUp, Receipt, Clock, CreditCard, Banknote, Download, Upload, ChevronRight } from 'lucide-react';

export default function FinancialJournalPage() {
  const { financials, importFinancial } = useDemoStore();
  const { card, cardInset, muted, btnPrimary, btnSecondary } = useVendorTheme();
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const totalGrossSales = financials.reduce((sum, f) => sum + f.grossSales, 0);
  const totalExpenses = financials.reduce((sum, f) => sum + f.expenses, 0);
  const totalNetProfit = totalGrossSales - totalExpenses;
  const overallMargin = totalGrossSales > 0 ? Math.round((totalNetProfit / totalGrossSales) * 100) : 0;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Journal</h1>
          <p className={`text-sm mt-1 ${muted}`}>Revenue, expenses, and performance after each event</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className={`rounded-2xl border p-4 col-span-2 md:col-span-1 ${card} ring-2 ring-amber-400/30`}>
            <div className={`text-xs ${muted} mb-1`}>Net profit</div>
            <div className="text-3xl font-bold text-amber-500">${totalNetProfit.toLocaleString()}</div>
            <div className={`text-xs mt-1 ${muted}`}>Last 30 days</div>
          </div>
          {[
            { label: 'Gross sales', value: `$${totalGrossSales.toLocaleString()}` },
            { label: 'Expenses', value: `$${totalExpenses.toLocaleString()}` },
            { label: 'Margin', value: `${overallMargin}%` },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border p-4 ${card}`}>
              <div className={`text-xs ${muted} mb-1`}>{s.label}</div>
              <div className="text-2xl font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        <div className={`rounded-2xl border p-5 mb-6 ${card}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-bold flex items-center gap-2">
              <Receipt className="h-4 w-4" /> Event ledger
            </h2>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowUploadDialog(true)} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${btnPrimary}`}>
                <Upload className="h-4 w-4" /> Import
              </button>
              <button type="button" className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm border ${btnSecondary}`}>
                <Download className="h-4 w-4" /> Export
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {financials.map(record => (
              <div key={record.id} className={`rounded-xl p-4 ${cardInset}`}>
                <div className="flex justify-between mb-3">
                  <div>
                    <h3 className="font-bold">{record.eventName}</h3>
                    <div className={`text-sm ${muted}`}>
                      {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-500">${record.netProfit.toLocaleString()}</div>
                    <div className={`text-xs ${muted}`}>net</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                  <div><span className={muted}>Gross </span><span className="font-semibold">${record.grossSales.toLocaleString()}</span></div>
                  <div><span className={muted}>Expenses </span><span className="font-semibold">${record.expenses.toLocaleString()}</span></div>
                  <div><span className={muted}>Margin </span><span className="font-semibold">{record.margin}%</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className={`rounded-lg p-2 ${card}`}>
                    <Clock className="h-3 w-3 inline mr-1" /> Break-even {record.breakEvenHour}
                  </div>
                  <div className={`rounded-lg p-2 ${card}`}>
                    <TrendingUp className="h-3 w-3 inline mr-1" /> Best hour {record.bestHour}
                  </div>
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center gap-1"><Banknote className="h-3.5 w-3.5 text-green-500" /> {record.cashPercent}% cash</span>
                  <span className="flex items-center gap-1"><CreditCard className="h-3.5 w-3.5 text-blue-500" /> {record.cardPercent}% card</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-2xl border p-5 mb-6 ${card}`}>
          <h2 className="font-bold mb-4">Receipt vault</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { category: 'Booth fees', count: 3, total: 775 },
              { category: 'Permits', count: 2, total: 75 },
              { category: 'Inventory', count: 8, total: 1450 },
              { category: 'Gas & mileage', count: 6, total: 180 },
              { category: 'Supplies', count: 4, total: 95 },
              { category: 'Insurance', count: 1, total: 850 },
            ].map(cat => (
              <div key={cat.category} className={`rounded-xl p-3 hover:ring-1 hover:ring-amber-400/50 cursor-pointer ${cardInset}`}>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-semibold">{cat.category}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
                <div className={`text-xs ${muted}`}>{cat.count} receipts</div>
                <div className="text-lg font-bold mt-1">${cat.total.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className={`rounded-2xl border p-4 ${card}`}>
            <h3 className="font-bold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-amber-500" /> Performance</h3>
            <div className={`space-y-2 text-sm ${muted}`}>
              <div className="flex justify-between"><span>Avg event profit</span><span className="font-semibold text-gray-900 dark:text-gray-100">${financials.length ? Math.round(totalNetProfit / financials.length).toLocaleString() : 0}</span></div>
              <div className="flex justify-between"><span>Best event</span><span className="font-semibold text-gray-900 dark:text-gray-100">Valentine&apos;s Day Fair</span></div>
              <div className="flex justify-between"><span>Avg break-even</span><span className="font-semibold text-gray-900 dark:text-gray-100">11:15 AM</span></div>
            </div>
          </div>
          <div className={`rounded-2xl border p-4 ${card}`}>
            <h3 className="font-bold mb-3">Payment mix</h3>
            <div className={`space-y-2 text-sm ${muted}`}>
              <div className="flex justify-between"><span>Cash</span><span className="font-semibold text-gray-900 dark:text-gray-100">44%</span></div>
              <div className="flex justify-between"><span>Card</span><span className="font-semibold text-gray-900 dark:text-gray-100">56%</span></div>
              <div className="flex justify-between"><span>Avg transaction</span><span className="font-semibold text-gray-900 dark:text-gray-100">$24.50</span></div>
            </div>
          </div>
        </div>
      </div>

      <PaymentUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onImport={importFinancial}
        eventName="Super Bowl Sunday Bazaar"
        eventDate="2026-02-01"
      />
    </AppLayout>
  );
}
