'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  StickyNote,
  Receipt,
  LayoutGrid,
} from 'lucide-react';
import type { VendorSubmission } from '@/lib/platform-data';
import { buildApplicationDetail } from '@/lib/application-detail';
import { VendorDecisionPanel } from '@/components/organizer/vendor-decision-panel';
import { DocumentCompletenessBadge } from '@/components/organizer/document-completeness-badge';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';

export interface ApplicationDetailDrawerProps {
  submission: VendorSubmission | null;
  allSubmissions: VendorSubmission[];
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRequestDoc: (id: string) => void;
  onSendCe200: (id: string) => void;
  onToggleShortlist: (id: string) => void;
  onToast: (msg: string) => void;
}

const DOC_STATUS_STYLE = {
  received: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  missing: 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300',
  expired: 'bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300',
  needs_review: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
} as const;

export function ApplicationDetailDrawer({
  submission,
  allSubmissions,
  onClose,
  onApprove,
  onReject,
  onRequestDoc,
  onSendCe200,
  onToggleShortlist,
  onToast,
}: ApplicationDetailDrawerProps) {
  const { surface, muted, heading, btnPrimary, btnSecondary, cardInset } = useOrganizerTheme();
  const [note, setNote] = useState('');
  const detail = useMemo(
    () => (submission ? buildApplicationDetail(submission, allSubmissions) : null),
    [submission, allSubmissions]
  );

  useEffect(() => {
    if (!submission) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [submission, onClose]);

  if (!submission || !detail) return null;

  const statusBadge =
    submission.status === 'pending'
      ? 'bg-amber-100 text-amber-800'
      : submission.status === 'approved'
        ? 'bg-emerald-100 text-emerald-800'
        : 'bg-red-100 text-red-800';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close drawer"
      />
      <aside
        className={`relative w-full sm:max-w-xl md:max-w-2xl h-[92vh] sm:h-full overflow-y-auto shadow-xl rounded-t-2xl sm:rounded-none ${surface}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-drawer-title"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 p-4 border-b border-stone-200/80 dark:border-stone-700 bg-inherit">
          <div className="min-w-0">
            <div className={`text-xs font-medium uppercase tracking-wide ${muted}`}>Vendor application</div>
            <h2 id="application-drawer-title" className={`text-xl font-bold truncate ${heading}`}>
              {detail.snapshot.businessName}
            </h2>
            <p className={`text-sm mt-0.5 ${muted}`}>{detail.application.eventName}</p>
          </div>
          <button type="button" onClick={onClose} className={`p-2 rounded-lg shrink-0 ${btnSecondary}`}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-6 pb-24">
          {/* Vendor snapshot */}
          <section aria-labelledby="snapshot-heading">
            <h3 id="snapshot-heading" className={`font-semibold text-sm mb-3 ${heading}`}>
              Vendor snapshot
            </h3>
            <div className={`rounded-xl p-4 ${cardInset}`}>
              <div className="flex gap-4">
                {detail.snapshot.setupPhotoUrl ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-stone-200">
                    <Image
                      src={detail.snapshot.setupPhotoUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-stone-200 dark:bg-stone-700 shrink-0 flex items-center justify-center text-stone-500 text-xs">
                    No photo
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className={`font-semibold ${heading}`}>{detail.snapshot.businessName}</div>
                  <div className={`text-sm ${muted}`}>{detail.snapshot.category}</div>
                  <DocumentCompletenessBadge
                    received={detail.docSummary.received}
                    total={detail.docSummary.total}
                    expiringSoon={detail.docSummary.expiringSoon}
                  />
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <InfoRow icon={Mail} label="Contact" value={detail.snapshot.contactName} sub={detail.snapshot.email} />
                <InfoRow icon={Phone} label="Phone" value={detail.snapshot.phone} />
                <InfoRow icon={MapPin} label="Service area" value={detail.snapshot.serviceArea} />
                <InfoRow
                  icon={Clock}
                  label="Years active"
                  value={detail.snapshot.yearsActive != null ? String(detail.snapshot.yearsActive) : '—'}
                />
              </dl>
              <p className={`mt-3 text-sm rounded-lg p-3 bg-white/60 dark:bg-stone-900/40 ${muted}`}>
                {detail.snapshot.trustSummary}
              </p>
            </div>
          </section>

          {/* AI match */}
          <VendorDecisionPanel
            vendorEmail={submission.vendorEmail}
            eventId={submission.eventId}
            vendorName={submission.vendorName}
          />

          {/* Application details */}
          <section aria-labelledby="app-details-heading">
            <h3 id="app-details-heading" className={`font-semibold text-sm mb-3 ${heading}`}>
              Application details
            </h3>
            <div className={`rounded-xl p-4 space-y-3 text-sm ${cardInset}`}>
              <Row label="Event" value={detail.application.eventName} />
              <Row
                label="Submitted"
                value={new Date(detail.application.submittedAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              />
              <Row label="Booth request" value={detail.application.boothRequest ?? '—'} />
              {detail.application.specialRequirements && (
                <Row label="Special requirements" value={detail.application.specialRequirements} />
              )}
              <div>
                <div className={`text-xs font-medium uppercase tracking-wide mb-1 ${muted}`}>Description</div>
                <p className={muted}>{detail.application.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge}`}>
                  {submission.status.toUpperCase()}
                </span>
                {submission.hasInsurance && (
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Insurance confirmed
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Documents */}
          <section aria-labelledby="docs-heading">
            <h3 id="docs-heading" className={`font-semibold text-sm mb-3 ${heading}`}>
              Documents & forms
            </h3>
            <ul className="space-y-2">
              {detail.documents.map(doc => (
                <li
                  key={doc.type}
                  className={`flex items-start justify-between gap-3 rounded-xl p-3 text-sm ${cardInset}`}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <FileText className="h-4 w-4 shrink-0 mt-0.5 text-stone-500" />
                    <div className="min-w-0">
                      <div className={`font-medium ${heading}`}>{doc.label}</div>
                      {doc.fileName && <div className={`text-xs truncate ${muted}`}>{doc.fileName}</div>}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize ${DOC_STATUS_STYLE[doc.status]}`}
                  >
                    {doc.status.replace('_', ' ')}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* History */}
          <section aria-labelledby="history-heading">
            <h3 id="history-heading" className={`font-semibold text-sm mb-3 ${heading}`}>
              History
            </h3>
            <ul className="space-y-2">
              {detail.history.map(h => (
                <li key={h.id} className={`rounded-xl p-3 text-sm ${cardInset}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-medium ${heading}`}>{h.eventName}</span>
                    <span className="text-xs capitalize text-stone-500">{h.status}</span>
                  </div>
                  <div className={`text-xs mt-1 ${muted}`}>
                    {new Date(h.date).toLocaleDateString()}
                    {h.note && ` · ${h.note}`}
                  </div>
                </li>
              ))}
            </ul>
            {detail.internalNotes.length > 0 && (
              <div className="mt-3">
                <div className={`text-xs font-medium uppercase tracking-wide mb-2 ${muted}`}>Internal notes</div>
                {detail.internalNotes.map((n, i) => (
                  <p key={i} className={`text-sm ${muted}`}>
                    {n}
                  </p>
                ))}
              </div>
            )}
          </section>

          {/* Internal note input */}
          <section aria-labelledby="note-heading">
            <h3 id="note-heading" className={`font-semibold text-sm mb-2 ${heading}`}>
              Add internal note
            </h3>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="Visible to organizers only…"
              className={`w-full rounded-lg border px-3 py-2 text-sm ${btnSecondary}`}
            />
            <button
              type="button"
              disabled={!note.trim()}
              onClick={() => {
                onToast('Note saved (pilot — not persisted)');
                setNote('');
              }}
              className={`mt-2 px-3 py-1.5 text-sm font-semibold rounded-lg disabled:opacity-50 ${btnSecondary}`}
            >
              Save note
            </button>
          </section>
        </div>

        {/* Sticky actions */}
        <div className="sticky bottom-0 border-t border-stone-200/80 dark:border-stone-700 p-4 bg-inherit">
          <div className="flex flex-wrap gap-2">
            {submission.status === 'pending' && (
              <>
                <button
                  type="button"
                  onClick={() => onApprove(submission.id)}
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg ${btnPrimary}`}
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => onReject(submission.id)}
                  className="flex items-center gap-1 px-3 py-2 border border-red-300 text-red-700 hover:bg-red-50 text-sm font-semibold rounded-lg"
                >
                  <XCircle className="h-4 w-4" /> Reject
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => onRequestDoc(submission.id)}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg ${btnSecondary}`}
            >
              <AlertCircle className="h-4 w-4" /> Request doc
            </button>
            {!submission.ce200SentAt && submission.requiredForms.includes('ce200') && (
              <button
                type="button"
                onClick={() => onSendCe200(submission.id)}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg ${btnSecondary}`}
              >
                Send CE200
              </button>
            )}
            <Link
              href={`/organizer/booths?eventId=${submission.eventId}`}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg ${btnSecondary}`}
            >
              <LayoutGrid className="h-4 w-4" /> Assign booth
            </Link>
            <button
              type="button"
              onClick={() => onToast('Invoice draft created (pilot placeholder)')}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg ${btnSecondary}`}
            >
              <Receipt className="h-4 w-4" /> Send invoice
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = `mailto:${submission.vendorEmail}?subject=VendorFlow — ${submission.eventName}`;
              }}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg ${btnSecondary}`}
            >
              <MessageSquare className="h-4 w-4" /> Message
            </button>
            <button
              type="button"
              onClick={() => onToggleShortlist(submission.id)}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg ${btnSecondary}`}
            >
              <StickyNote className="h-4 w-4" />
              {submission.shortlisted ? 'Unshortlist' : 'Shortlist'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-stone-500 flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </dt>
      <dd className="font-medium text-stone-900 dark:text-stone-100 mt-0.5">{value}</dd>
      {sub && <dd className="text-xs text-stone-500 truncate">{sub}</dd>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4">
      <span className="text-xs font-medium uppercase tracking-wide text-stone-500 sm:w-36 shrink-0">{label}</span>
      <span className="text-stone-800 dark:text-stone-200">{value}</span>
    </div>
  );
}
