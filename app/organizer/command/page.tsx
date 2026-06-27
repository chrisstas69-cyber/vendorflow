'use client';

import { useMemo, useState } from 'react';
import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { DocumentChecklist } from '@/components/vendor/document-checklist';
import { VendorSetupPreview } from '@/components/vendor/vendor-setup-preview';
import { useDemoStore } from '@/contexts/demo-store-context';
import { useTheme } from '@/contexts/theme-context';
import { missingDocuments, splitRequiredForms, type DocumentType } from '@/lib/documents';
import { CATEGORY_LABELS } from '@/lib/platform-data';
import { Download, Mail, CheckCircle2, FileText, Calendar, Star } from 'lucide-react';

export default function OrganizerCommandPage() {
  const { submissions, events, sendCe200Email, approveSubmission, downloadVendorPacket, toggleShortlist } =
    useDemoStore();
  const { mode } = useTheme();
  const dark = mode === 'night';
  const [toast, setToast] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const card = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const muted = dark ? 'text-gray-400' : 'text-gray-500';
  const inset = dark ? 'bg-gray-800/50' : 'bg-gray-50';
  const filterActive = 'bg-indigo-600 text-white';
  const filterIdle = dark
    ? 'bg-gray-900 text-gray-300 hover:bg-gray-800 border-gray-700'
    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return submissions;
    return submissions.filter(s => s.status === filter);
  }, [submissions, filter]);

  const approved = submissions.filter(s => s.status === 'approved');
  const pending = submissions.filter(s => s.status === 'pending');
  const docsComplete = approved.filter(s => {
    const req = s.requiredForms as DocumentType[];
    return missingDocuments(req, s.documents).length === 0;
  });

  return (
    <OrganizerLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Vendor Command Center</h1>
        <p className={`text-sm mt-1 ${muted}`}>
          Receive vendor COI, W-9, and permits. Send CE200 to vendors with no employees — they sign &amp; return it.
        </p>
      </div>

      {toast && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-green-500/15 border border-green-500/30 text-green-700 dark:text-green-400 text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Pending review', count: pending.length, icon: FileText },
          { label: 'Approved', count: approved.length, icon: CheckCircle2 },
          { label: 'Docs complete', count: docsComplete.length, icon: CheckCircle2 },
          { label: 'Your events', count: events.filter(e => !e.isClaimable).length, icon: Calendar },
        ].map(({ label, count, icon: Icon }) => (
          <div key={label} className={`rounded-xl border p-4 ${card}`}>
            <Icon className="h-4 w-4 text-indigo-500 mb-2" />
            <div className="text-2xl font-bold">{count}</div>
            <div className={`text-xs ${muted}`}>{label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: dark ? '#374151' : '#e5e7eb' }}>
          {(['all', 'pending', 'approved'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium capitalize border-r last:border-r-0 ${
                filter === f ? filterActive : filterIdle
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {approved.length > 0 && (
          <button
            type="button"
            onClick={() => {
              approved.forEach(s => downloadVendorPacket(s.id));
              showToast(`Downloaded ${approved.length} vendor packet${approved.length !== 1 ? 's' : ''}`);
            }}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
          >
            <Download className="h-4 w-4" />
            Download all approved
          </button>
        )}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <p className={`text-center py-8 ${muted}`}>No vendors in this view.</p>
        ) : (
          filtered.map(sub => {
            const event = events.find(e => e.id === sub.eventId);
            const required = sub.requiredForms as DocumentType[];
            const { submit, fromOrganizer } = splitRequiredForms(required);
            const missingSubmit = missingDocuments(submit, sub.documents);
            const hasSignedCe200 = sub.documents.some(d => d.type === 'ce200');

            return (
              <div key={sub.id} className={`rounded-xl border overflow-hidden ${card}`}>
                <div className={`p-5 border-b flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${dark ? 'border-gray-800' : 'border-gray-100'}`}>
                  <div>
                    <div className="font-bold text-lg">{sub.vendorName}</div>
                    <div className={`text-sm ${muted}`}>{sub.vendorEmail}</div>
                    <div className="text-sm font-medium text-indigo-500 dark:text-indigo-400 mt-1">
                      {sub.eventName}
                    </div>
                    {event && (
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${inset}`}>
                        {CATEGORY_LABELS[event.category]}
                      </span>
                    )}
                  </div>
                  <span
                    className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full ${
                      sub.status === 'pending'
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                        : sub.status === 'approved'
                          ? 'bg-green-500/15 text-green-700 dark:text-green-400'
                          : 'bg-red-500/15 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {sub.status.toUpperCase()}
                  </span>
                </div>

                <div className="p-5 grid md:grid-cols-[180px_1fr_1fr] gap-5">
                  <div>
                    <div className="text-sm font-semibold mb-2">Booth setup</div>
                    <VendorSetupPreview
                      src={sub.setupPhotoUrl}
                      vendorName={sub.vendorName}
                      size="md"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShortlist(sub.id)}
                      className={`mt-2 w-full flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        sub.shortlisted
                          ? 'bg-amber-400 text-gray-900'
                          : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Star className={`h-3.5 w-3.5 ${sub.shortlisted ? 'fill-current' : ''}`} />
                      {sub.shortlisted ? 'Shortlisted' : 'Shortlist setup'}
                    </button>
                  </div>
                  <div>
                    <div className="text-sm font-semibold mb-2">Vendor category</div>
                    <p className={`text-sm mb-3 ${muted}`}>{sub.category}</p>
                    {sub.message && (
                      <p className={`text-sm p-3 rounded-lg ${inset} ${muted}`}>{sub.message}</p>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold mb-2">
                      Received from vendor{' '}
                      {missingSubmit.length === 0 ? '✓' : `(${missingSubmit.length} missing)`}
                    </div>
                    <DocumentChecklist
                      required={submit}
                      documents={sub.documents}
                      readOnly
                      compact
                      onDownload={() => downloadVendorPacket(sub.id)}
                    />
                    {fromOrganizer.includes('ce200') && (
                      <div className="mt-3 text-xs">
                        {sub.ce200SentAt ? (
                          <span className="text-green-600 dark:text-green-400">
                            CE200 sent to vendor {new Date(sub.ce200SentAt).toLocaleDateString()}
                            {hasSignedCe200 ? ' · Signed copy received ✓' : ' · Awaiting signed return'}
                          </span>
                        ) : (
                          <span className={muted}>CE200 not sent yet — required if vendor has no employees</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className={`px-5 pb-5 flex flex-wrap gap-2 ${dark ? '' : ''}`}>
                  {sub.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => showToast(approveSubmission(sub.id).message)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg"
                      >
                        Approve vendor
                      </button>
                      {!sub.ce200SentAt && required.includes('ce200') && (
                        <button
                          type="button"
                          onClick={() => showToast(sendCe200Email(sub.id).message)}
                          className={`flex items-center gap-1 px-4 py-2 border text-sm font-semibold rounded-lg ${
                            dark
                              ? 'border-indigo-700 text-indigo-300 hover:bg-indigo-950'
                              : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                          }`}
                        >
                          <Mail className="h-4 w-4" /> Send CE200 to vendor
                        </button>
                      )}
                    </>
                  )}
                  {sub.status === 'approved' && (
                    <>
                      {!sub.ce200SentAt && required.includes('ce200') && (
                        <button
                          type="button"
                          onClick={() => showToast(sendCe200Email(sub.id).message)}
                          className={`flex items-center gap-1 px-4 py-2 border text-sm font-semibold rounded-lg ${
                            dark
                              ? 'border-indigo-700 text-indigo-300 hover:bg-indigo-950'
                              : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                          }`}
                        >
                          <Mail className="h-4 w-4" /> Send CE200 to vendor
                        </button>
                      )}
                      {sub.ce200SentAt && (
                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 px-3 py-2">
                          <Mail className="h-3.5 w-3.5" /> CE200 sent{' '}
                          {new Date(sub.ce200SentAt).toLocaleDateString()}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          downloadVendorPacket(sub.id);
                          showToast(`Downloaded packet for ${sub.vendorName}`);
                        }}
                        className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg"
                      >
                        <Download className="h-4 w-4" /> Download packet
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </OrganizerLayout>
  );
}
