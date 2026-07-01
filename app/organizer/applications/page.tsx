'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { VendorSetupPreview } from '@/components/vendor/vendor-setup-preview';
import { ApplicationDetailDrawer } from '@/components/organizer/application-detail-drawer';
import { DocumentCompletenessBadge } from '@/components/organizer/document-completeness-badge';
import { OrganizerLoadingState } from '@/components/organizer/organizer-loading-state';
import { buildApplicationDetail } from '@/lib/application-detail';
import { inboxItemsToSubmissions } from '@/lib/inbox-to-submission';
import { useOrganizerInbox } from '@/hooks/use-organizer-inbox';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { ArrowRight, ChevronRight, Star } from 'lucide-react';
import type { VendorSubmission } from '@/lib/platform-data';

export default function OrganizerApplicationsPage() {
  const { data, loading, error, reload, performAction } = useOrganizerInbox();
  const { card, muted, heading, pageTitle, btnPrimary, btnSecondary } = useOrganizerTheme();
  const [toast, setToast] = useState('');
  const [view, setView] = useState<'all' | 'shortlisted'>('all');
  const [selected, setSelected] = useState<VendorSubmission | null>(null);

  const submissions = useMemo(
    () => inboxItemsToSubmissions(data?.items ?? []),
    [data?.items]
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const filtered = useMemo(() => {
    if (view === 'shortlisted') return submissions.filter(s => s.shortlisted);
    return submissions;
  }, [submissions, view]);

  const shortlistedCount = submissions.filter(s => s.shortlisted).length;

  const patchApplication = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/organizer/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Update failed');
    await reload();
    return json;
  };

  const toggleShortlist = async (submissionId: string) => {
    const sub = submissions.find(s => s.id === submissionId);
    if (!sub?.applicationId) return;
    try {
      await patchApplication(sub.applicationId, { shortlisted: !sub.shortlisted });
    } catch {
      showToast('Shortlist requires hosted DB mode (PILOT_DATA_SOURCE=db)');
    }
  };

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const msg = await performAction(id, status === 'approved' ? 'accept' : 'reject');
      showToast(msg);
      if (selected?.id === id) {
        setSelected(prev => (prev ? { ...prev, status } : null));
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Action failed');
    }
  };

  if (loading) {
    return (
      <OrganizerLayout>
        <OrganizerLoadingState label="Loading applications…" />
      </OrganizerLayout>
    );
  }

  if (error) {
    return (
      <OrganizerLayout>
        <p className="text-red-600 text-sm">{error}</p>
      </OrganizerLayout>
    );
  }

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
              <div
                key={sub.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelected(sub)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelected(sub);
                  }
                }}
                className={`w-full text-left rounded-xl border overflow-hidden transition-shadow hover:shadow-md hover:ring-2 hover:ring-teal-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 cursor-pointer ${card}`}
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
                        void toggleShortlist(sub.id);
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
              </div>
            );
          })
        )}
      </div>

      <ApplicationDetailDrawer
        submission={selected}
        allSubmissions={submissions}
        onClose={() => setSelected(null)}
        onApprove={id => void handleReview(id, 'approved')}
        onReject={id => void handleReview(id, 'rejected')}
        onRequestDoc={id => {
          void performAction(id, 'request_info')
            .then(msg => showToast(msg))
            .catch(e => showToast(e instanceof Error ? e.message : 'Request failed'));
        }}
        onSendCe200={id => {
          void fetch('/api/organizer/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ submissionId: id, action: 'send_ce200' }),
          })
            .then(r => r.json())
            .then(data => showToast(data.message ?? (data.ok ? 'CE200 queued' : data.error)))
            .catch(e => showToast(e instanceof Error ? e.message : 'CE200 failed'));
        }}
        onToggleShortlist={id => void toggleShortlist(id)}
        onToast={showToast}
        onSaveNote={async (submissionId, note) => {
          const res = await fetch(`/api/organizer/applications/${submissionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appendInternalNote: note }),
          });
          if (!res.ok) throw new Error('Save failed');
          await reload();
        }}
      />
    </OrganizerLayout>
  );
}
