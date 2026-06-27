'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useVendorPassport } from '@/contexts/vendor-passport-context';
import { PassportValidationBanner } from '@/components/vendor/passport/validation-banner';
import { PassportGeneralTab } from '@/components/vendor/passport/general-tab';
import { PassportLogisticsTab } from '@/components/vendor/passport/logistics-tab';
import { PassportDocumentsTab } from '@/components/vendor/passport/documents-tab';
import { CreditCard, Building2, Truck, FileText, RefreshCw, MessageSquare } from 'lucide-react';
import { InvoicingPanel } from '@/components/invoicing/invoicing-panel';
import { FoundersEditionBanner } from '@/components/founders/founders-banner';

const TABS = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'logistics', label: 'Logistics & Tags', icon: Truck },
  { id: 'documents', label: 'Document center', icon: FileText },
  { id: 'invoicing', label: 'Invoicing', icon: CreditCard },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function VendorPassportPageInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabId) || 'general';
  const [tab, setTab] = useState<TabId>(
    TABS.some(t => t.id === initialTab) ? initialTab : 'general'
  );
  const { ready, passport, validation, refreshFromServer, resetToDemo } = useVendorPassport();

  useEffect(() => {
    const t = searchParams.get('tab') as TabId;
    if (t && TABS.some(x => x.id === t)) setTab(t);
  }, [searchParams]);

  if (!ready) {
    return (
      <AppLayout title="Vendor Passport">
        <div className="p-8 text-center text-gray-500 text-sm">Loading passport…</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Vendor Passport">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Vendor Passport</h1>
            <p className="text-sm text-gray-500 mt-1">
              One profile for every application — {passport.vendorEmail}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => refreshFromServer()}
              className="inline-flex items-center gap-1 px-3 py-2 border rounded-lg text-sm font-medium"
            >
              <RefreshCw className="h-4 w-4" /> Sync
            </button>
            <button
              type="button"
              onClick={resetToDemo}
              className="px-3 py-2 border rounded-lg text-xs text-gray-500"
            >
              Reset demo
            </button>
            <Link
              href="/vendor/assistant"
              className="inline-flex items-center gap-1 px-3 py-2 border rounded-lg text-sm font-medium"
            >
              <MessageSquare className="h-4 w-4" /> Assistant
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <FoundersEditionBanner compact />
        </div>

        <div className="mb-6">
          <PassportValidationBanner validation={validation} />
        </div>

        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors ${
                tab === id
                  ? 'border-amber-400 text-amber-700 dark:text-amber-300'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 md:p-6">
          {tab === 'general' && <PassportGeneralTab />}
          {tab === 'logistics' && <PassportLogisticsTab />}
          {tab === 'documents' && <PassportDocumentsTab />}
          {tab === 'invoicing' && (
            <InvoicingPanel role="vendor" vendorEmail={passport.vendorEmail} />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
