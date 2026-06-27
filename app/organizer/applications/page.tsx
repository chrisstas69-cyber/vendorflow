'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useDemoStore } from '@/contexts/demo-store-context';
import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { VendorSetupPreview } from '@/components/vendor/vendor-setup-preview';
import { Mail, ArrowRight, Star } from 'lucide-react';

export default function OrganizerApplicationsPage() {
  const { submissions, approveSubmission, sendCe200Email, updateSubmission, toggleShortlist } =
    useDemoStore();
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
          <h1 className="text-2xl font-bold mb-1">Vendor Applications</h1>
          <p className="text-gray-600 text-sm">
            Review booth setup photos, shortlist favorites, then approve
          </p>
        </div>
        <Link
          href="/organizer/command"
          className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline shrink-0"
        >
          Full command center <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {toast && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-green-100 text-green-800 text-sm font-medium">
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
              view === v ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-700'
            }`}
          >
            {v === 'shortlisted' ? `Shortlisted (${shortlistedCount})` : `All (${submissions.length})`}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <p className="text-gray-500">
            {view === 'shortlisted' ? 'No shortlisted vendors yet — star the setups you like.' : 'No applications yet.'}
          </p>
        ) : (
          filtered.map(sub => (
            <div key={sub.id} className="rounded-xl bg-white border border-gray-200 overflow-hidden">
              <div className="grid md:grid-cols-[200px_1fr] gap-0">
                <div className="relative bg-gray-100">
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
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="font-bold text-lg flex items-center gap-2">
                        {sub.vendorName}
                        {sub.shortlisted && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Shortlisted
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{sub.vendorEmail}</div>
                      <div className="text-sm font-medium text-indigo-600 mt-1">{sub.eventName}</div>
                    </div>
                    <span
                      className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full ${
                        sub.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : sub.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {sub.status.toUpperCase()}
                    </span>
                  </div>

                  {sub.message && (
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mb-3">{sub.message}</p>
                  )}

                  <div className="text-sm mb-4 text-gray-600">
                    {sub.hasInsurance && <span className="text-green-600 font-medium">✓ COI on file</span>}
                    {sub.documents.length > 0 && (
                      <span className="ml-3">{sub.documents.length} form{sub.documents.length > 1 ? 's' : ''} received</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        contactVendor(sub.vendorEmail, sub.vendorName);
                        showToast(`Opening email to ${sub.vendorName}`);
                      }}
                      className="flex items-center gap-1 px-4 py-2 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-sm font-semibold rounded-lg"
                    >
                      <Mail className="h-4 w-4" /> Reach out
                    </button>
                    {sub.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReview(sub.id, 'approved')}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg"
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
                        className="flex items-center gap-1 px-4 py-2 border text-sm font-semibold rounded-lg"
                      >
                        Send CE200
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </OrganizerLayout>
  );
}
