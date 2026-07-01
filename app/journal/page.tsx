'use client';

import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { PaymentUploadDialog } from '@/components/payment-upload-dialog';
import { EventDebriefPanel } from '@/components/vendor/event-debrief-panel';
import { EventLogbookExport } from '@/components/vendor/setup-checklist';
import { useVendorTheme } from '@/components/vendor/use-vendor-theme';
import { useDemoStore } from '@/contexts/demo-store-context';
import { useEventDebrief } from '@/contexts/event-debrief-context';
import { getVendorBookedEvents } from '@/lib/vendor-booked-events';
import { TrendingUp, Receipt, Clock, CreditCard, Banknote, Upload, ChevronRight, Lightbulb, BookOpen, Cloud } from 'lucide-react';
import { deriveJournalInsights } from '@/lib/journal-insights';

export default function FinancialJournalPage() {
  const { financials, importFinancial, applications } = useDemoStore();
  const { debriefs, getDebriefForEvent, mergeFinancial } = useEventDebrief();
  const bookedEvents = useMemo(() => getVendorBookedEvents(applications), [applications]);
  const { card, cardInset, muted, btnPrimary } = useVendorTheme();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const totalGrossSales = financials.reduce((sum, f) => sum + f.grossSales, 0);
  const totalExpenses = financials.reduce((sum, f) => sum + f.expenses, 0);
  const totalNetProfit = totalGrossSales - totalExpenses;
  const overallMargin = totalGrossSales > 0 ? Math.round((totalNetProfit / totalGrossSales) * 100) : 0;
  const insights = deriveJournalInsights(
    financials.map(f => ({
      id: f.id,
      eventName: f.eventName,
      date: f.date,
      grossSales: f.grossSales,
      expenses: f.expenses,
      netProfit: f.netProfit,
      margin: f.margin,
    }))
  );

  const handleImport = async (record: Parameters<typeof importFinancial>[0]) => {
    const created = importFinancial(record);
    await mergeFinancial(created);
  };

  const logbookCount = debriefs.filter(d => d.status === 'completed' || d.notes).length;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Journal</h1>
            <p className={`text-sm mt-1 ${muted}`}>
              Revenue, expenses, and your year-over-year event logbook
            </p>
          </div>
          <EventLogbookExport />
        </div>

        <div className={`rounded-2xl border p-4 mb-6 flex items-center gap-3 ${card}`}>
          <BookOpen className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">{logbookCount} logbook entries</span>
            <span className={muted}> — weather, crowd, notes, and money in one place. Export CSV or print your book anytime.</span>
          </div>
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
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" /> Insights
          </h2>
          <div className="space-y-3">
            {insights.map(insight => (
              <div
                key={insight.id}
                className={`rounded-xl p-4 ${cardInset} ${
                  insight.type === 'positive'
                    ? 'border-l-4 border-emerald-500'
                    : insight.type === 'warning'
                      ? 'border-l-4 border-amber-500'
                      : ''
                }`}
              >
                <div className="font-semibold text-sm">{insight.headline}</div>
                <p className={`text-sm mt-1 ${muted}`}>{insight.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-2xl border p-5 mb-6 ${card}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-bold flex items-center gap-2">
              <Receipt className="h-4 w-4" /> Event ledger
            </h2>
            <button type="button" onClick={() => setShowUploadDialog(true)} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${btnPrimary}`}>
              <Upload className="h-4 w-4" /> Import
            </button>
          </div>

          <div className="space-y-3">
            {financials.map(record => {
              const log = getDebriefForEvent(record.eventName, record.date);
              const expanded = expandedLogId === record.id;
              return (
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
                  <div className="flex gap-4 text-xs mb-3">
                    <span className="flex items-center gap-1"><Banknote className="h-3.5 w-3.5 text-green-500" /> {record.cashPercent}% cash</span>
                    <span className="flex items-center gap-1"><CreditCard className="h-3.5 w-3.5 text-blue-500" /> {record.cardPercent}% card</span>
                  </div>

                  {log && (log.weatherSummary || log.notes || log.topSellers) && (
                    <div className={`rounded-lg p-3 text-xs mb-3 ${card}`}>
                      {log.weatherSummary && (
                        <div className={`flex items-center gap-1 mb-1 ${muted}`}>
                          <Cloud className="h-3 w-3" /> {log.weatherSummary}
                          {log.crowdRating && <span className="ml-2">· Crowd {log.crowdRating}/5</span>}
                        </div>
                      )}
                      {log.topSellers && <div><span className={muted}>Sold: </span>{log.topSellers}</div>}
                      {log.notes && <div className="mt-1 line-clamp-2">{log.notes}</div>}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setExpandedLogId(expanded ? null : record.id)}
                    className={`text-xs font-semibold text-amber-600 flex items-center gap-1`}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    {expanded ? 'Hide logbook' : 'Edit event log'}
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                  </button>

                  {expanded && (
                    <div className="mt-3">
                      <EventDebriefPanel
                        eventId={record.eventId}
                        eventName={record.eventName}
                        eventDate={record.date}
                        status="completed"
                      />
                    </div>
                  )}
                </div>
              );
            })}
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
        onImport={handleImport}
        bookedEvents={bookedEvents}
      />
    </AppLayout>
  );
}
