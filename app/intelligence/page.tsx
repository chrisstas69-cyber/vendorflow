'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { useVendorTheme } from '@/components/vendor/use-vendor-theme';
import type { VendorIntelSummary } from '@/lib/intel/vendor-intel-summary';
import { Shield, AlertTriangle, DollarSign, MessageSquare, FileText } from 'lucide-react';

export default function IntelligencePage() {
  const { card, cardInset, muted } = useVendorTheme();
  const [summary, setSummary] = useState<VendorIntelSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/intel/summary')
      .then(r => r.json())
      .then(data => {
        if (data.ok) setSummary(data.summary);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !summary) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto p-6 text-sm text-gray-500">Loading intel from your logbook…</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Intel</h1>
          <p className={`text-sm mt-1 ${muted}`}>
            From your passport, logbook, and event history — not generic demo numbers
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className={`rounded-2xl border p-6 ${card}`}>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-amber-500" />
              <div>
                <div className={`text-sm ${muted}`}>Trust score</div>
                <div className="text-4xl font-bold text-amber-500">{summary.trustScore}</div>
              </div>
            </div>
            <p className={`text-xs ${muted}`}>
              {summary.completedEvents} logged events · passport + debrief data
            </p>
          </div>

          <div className={`rounded-2xl border p-6 ${card}`}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <div className={`text-sm ${muted}`}>Dud risk</div>
                <div className="text-4xl font-bold text-red-500">{summary.dudRisk}%</div>
              </div>
            </div>
            <p className={`text-xs ${muted}`}>Based on margins, crowd ratings, and rain days in your log</p>
          </div>
        </div>

        <div className={`rounded-2xl border p-5 mb-6 ${card}`}>
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Risk breakdown
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {summary.riskBreakdown.map(item => (
              <div key={item.label} className={`rounded-xl p-4 ${cardInset}`}>
                <div className={`text-xs ${muted} mb-1`}>{item.label}</div>
                <div className="text-xl font-bold text-green-600">{item.value}</div>
                <p className={`text-xs mt-1 ${muted}`}>{item.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-2xl border p-5 mb-6 ${card}`}>
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-amber-500" /> Your earnings history
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {summary.earningsPeer.map(item => (
              <div key={item.label} className={`rounded-xl p-4 text-center ${cardInset}`}>
                <div className={`text-xs ${muted} mb-1`}>{item.label}</div>
                <div className="text-2xl font-bold text-amber-600">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-2xl border p-5 mb-6 ${card}`}>
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Field reports (your logbook)
          </h2>
          <div className="space-y-3">
            {summary.fieldReports.length ? summary.fieldReports.map(report => (
              <div key={`${report.eventName}-${report.date}`} className={`rounded-xl p-4 ${cardInset}`}>
                <div className="flex justify-between mb-1">
                  <div>
                    <div className="font-semibold text-sm">{report.eventName}</div>
                    <div className={`text-xs ${muted}`}>{report.date}{report.weather ? ` · ${report.weather}` : ''}</div>
                  </div>
                  <div className="text-sm font-bold text-amber-600">${report.profit.toLocaleString()}</div>
                </div>
                <p className="text-sm">{report.notes}</p>
              </div>
            )) : (
              <p className={`text-sm ${muted}`}>Log events on Calendar or Journal to build field reports.</p>
            )}
          </div>
        </div>

        <div className={`rounded-2xl border p-5 ${card}`}>
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4" /> Tip
          </h2>
          <p className={`text-sm ${muted}`}>
            Dud risk drops when you log weather, crowd, and money after every fair. Your logbook powers this page.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
