'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { useVendorTheme } from '@/components/vendor/use-vendor-theme';
import { Shield, AlertTriangle, DollarSign, MessageSquare, FileText, TrendingUp } from 'lucide-react';

export default function IntelligencePage() {
  const { card, cardInset, muted, btnPrimary, btnSecondary } = useVendorTheme();
  const trustScore = 87;
  const dudRisk = 12;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Intel</h1>
          <p className={`text-sm mt-1 ${muted}`}>Trust scores, risk analysis, and what vendors like you earn</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className={`rounded-2xl border p-6 ${card}`}>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-amber-500" />
              <div>
                <div className={`text-sm ${muted}`}>Trust score</div>
                <div className="text-4xl font-bold text-amber-500">{trustScore}</div>
              </div>
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${trustScore}%` }} />
            </div>
            <p className={`text-xs mt-2 ${muted}`}>
              24 completed events · 3 verified reviews · 100% payment history
            </p>
          </div>

          <div className={`rounded-2xl border p-6 ${card}`}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <div className={`text-sm ${muted}`}>Dud risk</div>
                <div className="text-4xl font-bold text-red-500">{dudRisk}%</div>
              </div>
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div className="h-full bg-red-400 rounded-full" style={{ width: `${dudRisk}%` }} />
            </div>
            <p className={`text-xs mt-2 ${muted}`}>Low risk · 0 disputed fees · 0 canceled events</p>
          </div>
        </div>

        <div className={`rounded-2xl border p-5 mb-6 ${card}`}>
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Risk breakdown
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: 'Organizer reliability', value: '95%', note: 'Verified track record' },
              { label: 'Fee transparency', value: '100%', note: 'All fees disclosed' },
              { label: 'Cancellation history', value: '8%', note: '2 of 25 canceled' },
            ].map(item => (
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
            <DollarSign className="h-4 w-4 text-amber-500" /> Vendors like you earned
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: 'Average net', value: '$1,245' },
              { label: 'Top performer', value: '$2,840' },
              { label: 'Median ROI', value: '325%' },
            ].map(item => (
              <div key={item.label} className={`rounded-xl p-4 text-center ${cardInset}`}>
                <div className={`text-xs ${muted} mb-1`}>{item.label}</div>
                <div className="text-2xl font-bold text-amber-600">{item.value}</div>
              </div>
            ))}
          </div>
          <p className={`text-xs mt-3 ${muted}`}>47 toy vendors at similar events · last 90 days</p>
        </div>

        <div className={`rounded-2xl border p-5 mb-6 ${card}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Field reports
            </h2>
            <span className={`text-xs ${muted}`}>Last 30 days</span>
          </div>
          <div className="space-y-3">
            {[
              { vendor: 'ToyVendor_23', event: 'Spring Family Festival', tier: 'S-Tier', profit: '$2,150', comment: 'Foot traffic as advertised. Sold out by 2pm.' },
              { vendor: 'FunTimes_Vendor', event: 'Kids Carnival Weekend', tier: 'A-Tier', profit: '$1,620', comment: 'Dense family crowd, great margins.' },
              { vendor: 'PlayZone_Solo', event: 'Community Market Days', tier: 'B-Tier', profit: '$780', comment: 'Slower morning, picked up after lunch.' },
            ].map(report => (
              <div key={report.vendor} className={`rounded-xl p-4 ${cardInset}`}>
                <div className="flex justify-between mb-1">
                  <div>
                    <div className="font-semibold text-sm">{report.vendor}</div>
                    <div className={`text-xs ${muted}`}>{report.event}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-amber-600">{report.tier}</div>
                    <div className="text-xs font-semibold">{report.profit}</div>
                  </div>
                </div>
                <p className="text-sm">{report.comment}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-2xl border p-5 mb-6 ${card}`}>
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4" /> Organizer transparency
          </h2>
          <div className="space-y-2">
            {['Fee structure published', 'Refund policy clear', 'Historical data available', 'Setup time confirmed'].map(
              label => (
                <div key={label} className={`flex justify-between rounded-lg px-3 py-2 ${cardInset}`}>
                  <span className="text-sm">{label}</span>
                  <span className="text-sm font-semibold text-green-600">Yes</span>
                </div>
              )
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <button type="button" className={`rounded-xl py-3 px-4 ${btnPrimary}`}>
            Event chat
          </button>
          <button type="button" className={`rounded-xl py-3 px-4 border ${btnSecondary}`}>
            Submit after-action report
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
