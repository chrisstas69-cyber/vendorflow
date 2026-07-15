'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useVendorPassport } from '@/contexts/vendor-passport-context';
import { useVendorTheme } from '@/components/vendor/use-vendor-theme';
import { PassportValidationBanner } from '@/components/vendor/passport/validation-banner';
import { PassportCompletionMeter } from '@/components/vendor/passport-completion-meter';
import { PassportGeneralTab } from '@/components/vendor/passport/general-tab';
import { PassportLogisticsTab } from '@/components/vendor/passport/logistics-tab';
import { PassportDocumentsTab } from '@/components/vendor/passport/documents-tab';
import { CreditCard, Building2, Truck, FileText, RefreshCw, MessageSquare, Images, ExternalLink } from 'lucide-react';
import { InvoicingPanel } from '@/components/invoicing/invoicing-panel';
import { PassportPortfolioTab } from '@/components/vendor/passport/portfolio-tab';
import { FoundersEditionBanner } from '@/components/founders/founders-banner';
import { passportPublicSlug } from '@/lib/vendor-passport';

const TABS = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'logistics', label: 'Logistics & Tags', icon: Truck },
  { id: 'portfolio', label: 'Portfolio', icon: Images },
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
  const { card, muted, heading, tabActive, tabIdle, btnSecondary, accent, divider } = useVendorTheme();

  useEffect(() => {
    const t = searchParams.get('tab') as TabId;
    if (t && TABS.some(x => x.id === t)) setTab(t);
  }, [searchParams]);

  if (!ready) {
    return (
      <AppLayout title="Vendor Passport">
        <div className={`p-8 text-center text-sm ${muted}`}>Loading passport…</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Vendor Passport">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${heading}`}>Vendor Passport</h1>
            <p className={`text-sm mt-1 ${muted}`}>
              One profile for every application — {passport.vendorEmail}
            </p>
            <Link
              href={`/vendors/${passportPublicSlug(passport)}`}
              className={`inline-flex items-center gap-1 text-xs font-medium mt-2 ${accent}`}
            >
              Public profile <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => refreshFromServer()}
              className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium ${btnSecondary}`}
            >
              <RefreshCw className="h-4 w-4" /> Sync
            </button>
            <button
              type="button"
              onClick={resetToDemo}
              className={`px-3 py-2 rounded-lg text-xs ${btnSecondary} ${muted}`}
            >
              Reset demo
            </button>
            <Link
              href="/vendor/assistant"
              className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium ${btnSecondary}`}
            >
              <MessageSquare className="h-4 w-4" /> Assistant
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <FoundersEditionBanner compact />
        </div>

        <div className="mb-6 space-y-4">
          <div className={`rounded-xl border p-5 ${card}`}>
            <PassportCompletionMeter validation={validation} />
          </div>
          <PassportValidationBanner validation={validation} />
        </div>

        <div className={`flex gap-1 border-b mb-6 overflow-x-auto ${divider}`}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors ${
                tab === id ? tabActive : tabIdle
              }`}
            >
              <Icon className={`h-4 w-4 ${tab === id ? accent : ''}`} />
              {label}
            </button>
          ))}
        </div>

        <div className={`rounded-xl border p-5 md:p-6 ${card}`}>
          {tab === 'general' && <PassportGeneralTab />}
          {tab === 'logistics' && <PassportLogisticsTab />}
          {tab === 'portfolio' && <PassportPortfolioTab />}
          {tab === 'documents' && <PassportDocumentsTab />}
          {tab === 'invoicing' && (
            <InvoicingPanel role="vendor" vendorEmail={passport.vendorEmail} />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
