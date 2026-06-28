'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useDemoStore } from '@/contexts/demo-store-context';
import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { VendorSetupPreview } from '@/components/vendor/vendor-setup-preview';
import { ApplicationDetailDrawer } from '@/components/organizer/application-detail-drawer';
import { DocumentCompletenessBadge } from '@/components/organizer/document-completeness-badge';
import { buildApplicationDetail } from '@/lib/application-detail';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { ArrowRight, ChevronRight, Star } from 'lucide-react';
import type { VendorSubmission } from '@/lib/platform-data';

export default function OrganizerApplicationsPage() {
  const { submissions, approveSubmission, sendCe200Email, updateSubmission, toggleShortlist } =
    useDemoStore();
  const { card, muted, heading, pageTitle, btnPrimary, btnSecondary } = useOrganizerTheme();
  const [toast, setToast] = useState('');
  const [view, setView] = useState<'all' | 'shortlisted'>('all');
  const [selected, setSelected] = useState<VendorSubmission | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const filtered = useMemo(() => {
    if (view === 'shortlisted') return submissions.filter(s => s.shortlisted);
    return submissions;
  }, [submissions, view]);

  const shortlistedCount = submissions.filter(s => s.shortlisted).length;

  const handleReview = (id: string, status: 'approved' | 'rejected') => {
    if (status === 'approved') {
      showToast(approveSubmission(id).message);
    } else {
      updateSubmission(id, { status: 'rejected' });
      showToast('Application rejected');
    }
    if (selected?.id === id) {
      setSelected(prev => (prev ? { ...prev, status } : null));
    }
  };

  return (
    <OrganizerLayout>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className={`${pageTitle} ${heading}`}>Vendor applications</h1>
          <p className={`text-base mt-1 ${muted}`}>
            Click any application to review profile, documents, and take action
          </p>
        </div>
        <Link
          href="/organizer"
          className="flex items-center gap-1 text-sm font-semibold text-teal-600 hover:underline shrink-0"
        >
          Pipeline board <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {toast && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-800 text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {(['all', 'shortlisted'] as const).map(v => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              view === v ? btnPrimary : btnSecondary
            }`}
          >
            {v === 'shortlisted' ? `Shortlisted (${shortlistedCount})` : `All (${submissions.length})`}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className={muted}>
            {view === 'shortlisted' ? 'No shortlisted vendors yet — star the setups you like.' : 'No applications yet.'}
          </p>
        ) : (
          filtered.map(sub => {
            const detail = buildApplicationDetail(sub, submissions);
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelected(sub)}
                className={`w-full text-left rounded-xl border overflow-hidden transition-shadow hover:shadow-md hover:ring-2 hover:ring-teal-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${card}`}
              >
                <div className="grid md:grid-cols-[140px_1fr_auto] gap-0 items-stretch">
                  <div className="relative bg-stone-100 dark:bg-stone-800 min-h-[120px]">
                    <VendorSetupPreview
                      src={sub.setupPhotoUrl}
                      vendorName={sub.vendorName}
                      category={sub.category}
                      size="lg"
                      className="rounded-none border-0 h-full min-h-[120px]"
                    />
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        toggleShortlist(sub.id);
                      }}
                      className={`absolute top-2 left-2 p-2 rounded-full shadow ${
                        sub.shortlisted ? 'bg-amber-400 text-gray-900' : 'bg-white/90 text-gray-600 hover:bg-white'
                      }`}
                      aria-label={sub.shortlisted ? 'Remove from shortlist' : 'Shortlist'}
                    >
                      <Star className={`h-4 w-4 ${sub.shortlisted ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="p-4 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`font-bold text-lg ${heading}`}>{sub.vendorName}</span>
                      {sub.shortlisted && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Shortlisted
                        </span>
                      )}
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          sub.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : sub.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>
                    <div className={`text-sm ${muted}`}>{sub.category}</div>
                    <div className="text-sm font-medium text-teal-600 mt-0.5">{sub.eventName}</div>
                    {sub.message && (
                      <p className={`text-sm mt-2 line-clamp-2 ${muted}`}>{sub.message}</p>
                    )}
                    <div className="mt-3">
                      <DocumentCompletenessBadge
                        received={detail.docSummary.received}
                        total={detail.docSummary.total}
                        expiringSoon={detail.docSummary.expiringSoon}
                        compact
                      />
                    </div>
                  </div>

                  <div className="hidden md:flex items-center px-4 text-stone-400">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <ApplicationDetailDrawer
        submission={selected}
        allSubmissions={submissions}
        onClose={() => setSelected(null)}
        onApprove={id => handleReview(id, 'approved')}
        onReject={id => handleReview(id, 'rejected')}
        onRequestDoc={id => {
          updateSubmission(id, { infoRequested: true });
          showToast('Document request sent to vendor');
        }}
        onSendCe200={id => showToast(sendCe200Email(id).message)}
        onToggleShortlist={toggleShortlist}
        onToast={showToast}
      />
    </OrganizerLayout>
  );
}
