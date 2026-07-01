'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { VendorFormSections } from '@/components/vendor/vendor-form-sections';
import { VendorSetupPreview } from '@/components/vendor/vendor-setup-preview';
import { SetupPhotoUpload } from '@/components/vendor/setup-photo-upload';
import { useVendorTheme } from '@/components/vendor/use-vendor-theme';
import { useVendorApplications } from '@/contexts/vendor-applications-context';
import type { Application } from '@/lib/mock-data';
import { missingDocuments, splitRequiredForms, type DocumentType } from '@/lib/documents';
import {
  Clock,
  CreditCard,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

const STEPS = [
  { key: 'scraped', label: 'Saved' },
  { key: 'applied', label: 'Applied' },
  { key: 'coi', label: 'Paperwork' },
  { key: 'paid', label: 'Paid' },
  { key: 'booked', label: 'Booked' },
] as const;

function ApplicationCard({
  application,
  onUpload,
  onMarkPaid,
  onSetupPhoto,
  card,
  muted,
}: {
  application: Application;
  onUpload: (appId: string, type: DocumentType) => void;
  onMarkPaid: (appId: string) => void;
  onSetupPhoto: (appId: string, url: string | undefined) => void;
  card: string;
  muted: string;
}) {
  const stepIndex = STEPS.findIndex(s => s.key === application.status);
  const required = application.requiredForms as DocumentType[];
  const { submit } = splitRequiredForms(required);
  const missingSubmit = missingDocuments(submit, application.documents);
  const daysLeft = application.deadline
    ? Math.ceil((new Date(application.deadline).getTime() - Date.now()) / (86400000))
    : null;

  return (
    <div className={`rounded-2xl border overflow-hidden ${card}`}>
      <div className="p-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg">{application.eventName}</h3>
            {application.organizerName && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-0.5">
                Send paperwork to: {application.organizerName}
              </p>
            )}
            <p className={`text-sm mt-1 ${muted}`}>{application.microStatus}</p>
          </div>
          {daysLeft !== null && daysLeft > 0 && daysLeft <= 30 && (
            <div
              className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${
                daysLeft <= 7 ? 'bg-red-500/15 text-red-600' : 'bg-amber-500/15 text-amber-700'
              }`}
            >
              <Clock className="h-3 w-3" />
              {daysLeft}d left
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 mt-4">
          {STEPS.map((step, i) => (
            <div key={step.key} className="flex-1">
              <div
                className={`h-1.5 rounded-full ${i <= stepIndex ? 'bg-amber-400' : 'bg-gray-200 dark:bg-gray-700'}`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          {STEPS.map((step, i) => (
            <span
              key={step.key}
              className={`text-[10px] ${i <= stepIndex ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}
            >
              {step.label}
            </span>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-2">Your booth setup</h4>
          <p className={`text-xs mb-2 ${muted}`}>Organizers review this when choosing vendors</p>
          {application.setupPhotoUrl ? (
            <VendorSetupPreview
              src={application.setupPhotoUrl}
              vendorName={application.eventName}
              size="md"
              className="mb-2"
            />
          ) : null}
          <SetupPhotoUpload
            value={application.setupPhotoUrl}
            onChange={url => onSetupPhoto(application.id, url)}
            label={application.setupPhotoUrl ? 'Update setup photo' : 'Add setup photo'}
          />
        </div>

        <VendorFormSections
          required={required}
          documents={application.documents}
          ce200Sent={application.ce200Sent}
          onUpload={type => onUpload(application.id, type)}
          onDownload={doc => {
            const blob = new Blob([`Mock download: ${doc.fileName}`], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.fileName;
            a.click();
            URL.revokeObjectURL(url);
          }}
        />

        <div className="flex flex-wrap gap-2 pt-2">
          {application.eventId && (
            <Link
              href={`/events/${application.eventId}`}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View event
            </Link>
          )}
          {!application.paid && application.status !== 'scraped' && missingSubmit.length === 0 && (
            <button
              type="button"
              onClick={() => onMarkPaid(application.id)}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold"
            >
              <CreditCard className="h-3.5 w-3.5" /> Pay ${application.boothFee}
            </button>
          )}
          {application.paid && (
            <span className="inline-flex items-center gap-1 px-3 py-2 text-sm text-green-700 dark:text-green-400 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="h-3.5 w-3.5" /> Paid
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommandCenterPage() {
  const { applications, refresh } = useVendorApplications();
  const { card, muted } = useVendorTheme();
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const patchApplication = async (appId: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/vendors/applications/${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.ok) await refresh();
    return data;
  };

  const handleUpload = async (appId: string, type: DocumentType) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;
    const data = await patchApplication(appId, { uploadDocType: type });
    showToast(data.ok ? `${type.toUpperCase()} uploaded` : data.error ?? 'Upload failed');
  };

  const handleMarkPaid = async (appId: string) => {
    const data = await patchApplication(appId, { markPaid: true });
    showToast(data.ok ? 'Payment recorded' : data.error ?? 'Update failed');
  };

  const needsAction = applications.filter(a => {
    const { submit, fromOrganizer } = splitRequiredForms(a.requiredForms as DocumentType[]);
    const missingSubmit = missingDocuments(submit, a.documents);
    const missingCe200 =
      fromOrganizer.includes('ce200') && a.ce200Sent && !a.documents.some(d => d.type === 'ce200');
    return missingSubmit.length > 0 || missingCe200;
  });

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Command Center</h1>
          <p className={`text-sm mt-1 ${muted}`}>
            Submit COI, W-9, and permits to each organizer. Sign &amp; return CE200 only if they send it to you.
          </p>
        </div>

        {toast && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-green-500/15 border border-green-500/30 text-green-700 dark:text-green-400 text-sm font-medium">
            {toast}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total', count: applications.length },
            { label: 'Needs paperwork', count: needsAction.length },
            { label: 'Paid', count: applications.filter(a => a.paid).length },
            { label: 'Booked', count: applications.filter(a => a.status === 'booked').length },
          ].map(stat => (
            <div key={stat.label} className={`rounded-xl border p-4 text-center ${card}`}>
              <div className="text-2xl font-bold">{stat.count}</div>
              <div className={`text-xs ${muted}`}>{stat.label}</div>
            </div>
          ))}
        </div>

        {needsAction.length > 0 && (
          <div className="mb-6 flex items-start gap-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">
                {needsAction.length} application{needsAction.length > 1 ? 's' : ''} need paperwork
              </span>
              <span className={muted}>
                {' '}
                — send COI, W-9, and permits to the organizer. Return signed CE200 only if they emailed it.
              </span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className={`text-center py-12 ${muted}`}>
              <p className="mb-3">No applications yet.</p>
              <Link href="/pulse" className="text-amber-600 font-semibold hover:underline">
                Browse events →
              </Link>
            </div>
          ) : (
            applications.map(app => (
              <ApplicationCard
                key={app.id}
                application={app}
                onUpload={handleUpload}
                onSetupPhoto={async (id, url) => {
                  const data = await patchApplication(id, { setupPhotoUrl: url });
                  showToast(data.ok ? (url ? 'Setup photo saved' : 'Setup photo removed') : 'Save failed');
                }}
                onMarkPaid={handleMarkPaid}
                card={card}
                muted={muted}
              />
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
