'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useDemoStore } from '@/contexts/demo-store-context';
import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { VendorSetupPreview } from '@/components/vendor/vendor-setup-preview';
import { VendorDecisionPanel } from '@/components/organizer/vendor-decision-panel';
import { DocumentStatusChips } from '@/components/organizer/document-status-chips';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import type { DocumentType } from '@/lib/documents';
import { Mail, ArrowRight, Star } from 'lucide-react';

export default function OrganizerApplicationsPage() {
  const { submissions, approveSubmission, sendCe200Email, updateSubmission, toggleShortlist } =
    useDemoStore();
  const { card, muted, heading, pageTitle, btnPrimary, btnSecondary } = useOrganizerTheme();
  const [toast, setToast] = useState('');
  const [view, setView] = useState<'all' | 'shortlisted'>('all');

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
  };

  const contactVendor = (email: string, name: string) => {
    window.location.href = `mailto:${email}?subject=VendorFlow — interested in your booth setup&body=Hi ${name}, we liked your setup photo and would like to discuss your booth for our event.`;
  };

  return (
    <OrganizerLayout>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className={`${pageTitle} ${heading}`}>Vendor applications</h1>
          <p className={`text-base mt-1 ${muted}`}>
            Review booth setup photos, shortlist favorites, then approve
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

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <p className={muted}>
            {view === 'shortlisted' ? 'No shortlisted vendors yet — star the setups you like.' : 'No applications yet.'}
          </p>
        ) : (
          filtered.map(sub => {
            const uploaded = sub.documents.map(d => d.type);
            const missing = (sub.requiredForms as DocumentType[]).filter(r => !uploaded.includes(r));
            return (
              <div key={sub.id} className={`rounded-xl border overflow-hidden ${card}`}>
                <div className="grid md:grid-cols-[200px_1fr] gap-0">
                  <div className="relative bg-stone-100 dark:bg-stone-800">
                    <VendorSetupPreview
                      src={sub.setupPhotoUrl}
                      vendorName={sub.vendorName}
                      category={sub.category}
                      size="lg"
                      className="rounded-none border-0 h-full min-h-[180px]"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShortlist(sub.id)}
                      className={`absolute top-2 left-2 p-2 rounded-full shadow ${
                        sub.shortlisted ? 'bg-amber-400 text-gray-900' : 'bg-white/90 text-gray-600 hover:bg-white'
                      }`}
                      title={sub.shortlisted ? 'Remove from shortlist' : 'Shortlist this setup'}
                    >
                      <Star className={`h-4 w-4 ${sub.shortlisted ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="p-5">
                    <VendorDecisionPanel
                      vendorEmail={sub.vendorEmail}
                      eventId={sub.eventId}
                      vendorName={sub.vendorName}
                    />
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div>
                        <div className={`font-bold text-lg flex items-center gap-2 ${heading}`}>
                          {sub.vendorName}
                          {sub.shortlisted && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              Shortlisted
                            </span>
                          )}
                        </div>
                        <div className={`text-sm ${muted}`}>{sub.vendorEmail}</div>
                        <div className="text-sm font-medium text-teal-600 mt-1">{sub.eventName}</div>
                      </div>
                      <span
                        className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full ${
                          sub.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : sub.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {sub.status.toUpperCase()}
                      </span>
                    </div>

                    {sub.message && (
                      <p className={`text-sm bg-stone-50 dark:bg-stone-800/50 p-3 rounded-lg mb-3 ${muted}`}>
                        {sub.message}
                      </p>
                    )}

                    <div className="mb-3">
                      <DocumentStatusChips missing={missing} uploaded={uploaded} />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          contactVendor(sub.vendorEmail, sub.vendorName);
                          showToast(`Opening email to ${sub.vendorName}`);
                        }}
                        className={`flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-lg border ${btnSecondary}`}
                      >
                        <Mail className="h-4 w-4" /> Reach out
                      </button>
                      {sub.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReview(sub.id, 'approved')}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg ${btnPrimary}`}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReview(sub.id, 'rejected')}
                            className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 text-sm font-semibold rounded-lg"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {!sub.ce200SentAt && sub.requiredForms.includes('ce200') && (
                        <button
                          type="button"
                          onClick={() => showToast(sendCe200Email(sub.id).message)}
                          className={`flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-lg border ${btnSecondary}`}
                        >
                          Send CE200
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </OrganizerLayout>
  );
}
