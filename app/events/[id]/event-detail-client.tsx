'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useDemoStore } from '@/contexts/demo-store-context';
import { useVendorPassport } from '@/contexts/vendor-passport-context';
import { PublicLayout } from '@/components/layout/public-layout';
import { CATEGORY_LABELS } from '@/lib/platform-data';
import { SetupPhotoUpload } from '@/components/vendor/setup-photo-upload';
import { TrustGalleryView } from '@/components/gallery/trust-gallery-view';
import { useGallery } from '@/hooks/use-gallery';
import {
  EventInterestButton,
  EventInterestStat,
} from '@/components/public/event-interest-button';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Store,
  ArrowLeft,
  CheckCircle,
  Star,
  AlertTriangle,
} from 'lucide-react';
import { mockVendorPassport } from '@/lib/vendor-passport';
import { submitVendorApplicationToOrganizer } from '@/lib/vendor-apply-api';
import { runLongIslandComplianceCheck } from '@/lib/long-island/compliance-check';
import { FoundersEditionBanner } from '@/components/founders/founders-banner';
import { LocalComplianceAlert } from '@/components/founders/local-compliance-alert';

export function EventDetailClient() {
  const params = useParams();
  const id = params.id as string;
  const { getEvent, incrementViews, submitVendorApplication, submissions } = useDemoStore();
  const { passport, validation } = useVendorPassport();
  const event = getEvent(id);
  const { items: galleryItems, loading: galleryLoading } = useGallery('event', id, {
    publicOnly: true,
  });

  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({
    vendorName: 'Demo Vendor Co.',
    vendorEmail: 'vendor@demo.vendorflow.app',
    category: 'LED Toys',
    message: '',
    hasInsurance: true,
    setupPhotoUrl: undefined as string | undefined,
  });
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [formError, setFormError] = useState('');

  const confirmedVendors = useMemo(() => {
    if (!event) return [];
    return submissions.filter(
      s =>
        s.eventId === event.id &&
        (s.status === 'approved' || s.pipelineStage === 'approved' || s.paymentStatus === 'paid')
    );
  }, [event, submissions]);

  useEffect(() => {
    if (event) incrementViews(event.id);
  }, [event, incrementViews]);

  if (!event) {
    return (
      <PublicLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold vf-text mb-4">Event not found</h1>
          <Link href="/" className="text-orange-600 font-semibold hover:underline">
            ← Back to events
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const slotsLeft = event.vendorSlots - event.vendorSlotsFilled;
  const confirmedCount = Math.max(confirmedVendors.length, event.vendorSlotsFilled);
  const liCompliance = runLongIslandComplianceCheck(mockVendorPassport, event);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = form.vendorName.trim();
    const email = form.vendorEmail.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!name) {
      setFormError('Please enter your business name.');
      return;
    }
    if (!emailOk) {
      setFormError('Please enter a valid email address.');
      return;
    }
    setFormError('');

    setApplying(true);
    const local = submitVendorApplication({ eventId: event.id, ...form });
    const remote = await submitVendorApplicationToOrganizer(event, form);
    setApplying(false);

    if (remote.ok) {
      setResult({ ok: true, message: remote.message });
      setShowApply(false);
    } else if (local.ok) {
      setResult({
        ok: false,
        message: `${remote.message} Your details are saved on this device — reopen to resubmit.`,
      });
    } else {
      setResult({ ok: false, message: remote.message });
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <FoundersEditionBanner compact />
        <div className="h-4" />
        <Link href="/" className="inline-flex items-center gap-1 text-sm vf-text-muted hover:vf-text mb-4">
          <ArrowLeft className="h-4 w-4" /> All events
        </Link>

        <TrustGalleryView
          entityType="event"
          items={galleryItems}
          loading={galleryLoading}
          title={event.name}
          overlayTitle={event.name}
          overlaySubtitle={CATEGORY_LABELS[event.category]}
          fallbackImageUrl={event.coverImageUrl}
          showTagFilter
          className="mb-6"
          overlayBadge={
            event.promotionTier !== 'none' ? (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-600 text-white text-xs font-bold">
                <Star className="h-3 w-3" />
                {event.promotionTier === 'spotlight' ? 'SPONSORED SPOTLIGHT' : 'FEATURED'}
              </div>
            ) : undefined
          }
        />

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div>
              <p className="vf-text-muted mb-2">
                Hosted by{' '}
                <Link
                  href="/organizers/hempstead-chamber"
                  className="font-medium vf-text hover:underline"
                >
                  {event.organizerName}
                </Link>
              </p>
              <EventInterestStat eventId={event.id} initialSaves={event.saves} />
              <p className="vf-text leading-relaxed mt-3">{event.description}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex gap-3 p-4 rounded-xl border vf-border vf-surface">
                <Calendar className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold vf-text text-sm">
                    {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  {event.time && <div className="text-sm vf-text-muted">{event.time}</div>}
                </div>
              </div>
              <div className="flex gap-3 p-4 rounded-xl border vf-border vf-surface">
                <MapPin className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold vf-text text-sm">{event.location}</div>
                  <div className="text-sm vf-text-muted">
                    {event.city}, {event.state}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-4 rounded-xl border vf-border vf-surface">
                <Users className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold vf-text text-sm">{event.footTraffic} expected</div>
                  <div className="text-sm vf-text-muted">{event.familyDensity}% family-friendly</div>
                </div>
              </div>
              <div className="flex gap-3 p-4 rounded-xl border vf-border vf-surface ring-1 ring-orange-500/20">
                <Store className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold vf-text text-sm tabular-nums">
                    {confirmedCount} vendor{confirmedCount === 1 ? '' : 's'} confirmed
                  </div>
                  <div className="text-sm vf-text-muted">
                    {slotsLeft} booth slot{slotsLeft === 1 ? '' : 's'} left
                  </div>
                </div>
              </div>
              {event.applicationDeadline && (
                <div className="flex gap-3 p-4 rounded-xl border vf-border vf-surface sm:col-span-2">
                  <Clock className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold vf-text text-sm">Vendor deadline</div>
                    <div className="text-sm vf-text-muted">
                      {new Date(event.applicationDeadline).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {confirmedVendors.length > 0 && (
              <div className="rounded-2xl border vf-border vf-surface p-4">
                <h3 className="text-sm font-semibold vf-text mb-3">Confirmed vendors</h3>
                <ul className="space-y-2">
                  {confirmedVendors.slice(0, 8).map(v => (
                    <li key={v.id} className="flex items-center justify-between text-sm gap-3">
                      <Link
                        href={`/vendors/${v.vendorName
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)/g, '')}`}
                        className="vf-text font-medium hover:underline truncate"
                      >
                        {v.vendorName}
                      </Link>
                      <span className="vf-text-muted text-xs shrink-0">{v.category}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {event.audienceTags.map(tag => (
                <span key={tag} className="vf-bg-subtle vf-text-muted px-3 py-1 text-sm rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl border vf-border vf-surface sticky top-24 space-y-3">
              <div className="flex items-center gap-2 font-semibold vf-text mb-1">
                <Store className="h-4 w-4 text-orange-600" />
                Going to this event?
              </div>
              <p className="text-xs vf-text-muted">
                Save it or mark interested — organizers and vendors see the demand.
              </p>
              <EventInterestButton eventId={event.id} initialSaves={event.saves} kind="rsvp" />
              <EventInterestButton eventId={event.id} initialSaves={event.saves} kind="save" />

              <div className="border-t vf-border pt-4 mt-2">
                <div className="text-sm font-semibold vf-text mb-1">Vendor booths</div>
                <p className="text-sm vf-text-muted mb-3">
                  ${event.boothFee} booth fee
                  {event.permitFee > 0 ? ` + $${event.permitFee} permit` : ''}
                  <br />
                  <span className="font-medium text-orange-600 tabular-nums">
                    {confirmedCount} confirmed
                  </span>{' '}
                  · {slotsLeft} slots left
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      vendorName: passport.businessName || 'Demo Vendor Co.',
                      vendorEmail: passport.vendorEmail,
                      category: passport.categories[0] ?? 'LED Toys',
                      message: '',
                      hasInsurance: passport.documents.some(d => d.type === 'coi'),
                      setupPhotoUrl: passport.setupPhotoUrl,
                    });
                    setShowApply(true);
                  }}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Apply as Vendor
                </button>
                {!validation.readyForMatching && (
                  <p className="text-xs text-amber-700 mt-2 text-center">
                    Passport: {validation.label} —{' '}
                    <Link href="/vendor" className="underline">
                      complete profile
                    </Link>
                  </p>
                )}
                <Link
                  href="/pulse"
                  className="block text-center text-xs text-orange-600 font-medium mt-3 hover:underline"
                >
                  Open vendor Pulse →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {result && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm ${
              result.ok
                ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-900 border border-amber-500/20'
            }`}
          >
            {result.ok ? (
              <CheckCircle className="inline h-4 w-4 mr-1" />
            ) : (
              <AlertTriangle className="inline h-4 w-4 mr-1" />
            )}
            {result.message}
          </div>
        )}

        {showApply && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
            <form
              onSubmit={handleApply}
              className="w-full max-w-lg rounded-2xl border vf-border vf-surface p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-lg font-bold vf-text">Apply to {event.name}</h2>
              <LocalComplianceAlert result={liCompliance} />
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <label className="block text-sm">
                <span className="vf-text-muted text-xs">Business name</span>
                <input
                  className="mt-1 w-full rounded-lg border vf-border px-3 py-2 vf-surface vf-text"
                  value={form.vendorName}
                  onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))}
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="vf-text-muted text-xs">Email</span>
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border vf-border px-3 py-2 vf-surface vf-text"
                  value={form.vendorEmail}
                  onChange={e => setForm(f => ({ ...f, vendorEmail: e.target.value }))}
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="vf-text-muted text-xs">Category</span>
                <input
                  className="mt-1 w-full rounded-lg border vf-border px-3 py-2 vf-surface vf-text"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="vf-text-muted text-xs">Message</span>
                <textarea
                  className="mt-1 w-full rounded-lg border vf-border px-3 py-2 vf-surface vf-text"
                  rows={3}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                />
              </label>
              <SetupPhotoUpload
                value={form.setupPhotoUrl}
                onChange={url => setForm(f => ({ ...f, setupPhotoUrl: url }))}
              />
              <label className="flex items-center gap-2 text-sm vf-text">
                <input
                  type="checkbox"
                  checked={form.hasInsurance}
                  onChange={e => setForm(f => ({ ...f, hasInsurance: e.target.checked }))}
                />
                I have liability insurance (COI)
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApply(false)}
                  className="flex-1 py-2.5 rounded-xl border vf-border font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white font-semibold text-sm disabled:opacity-50"
                >
                  {applying ? 'Submitting…' : 'Submit application'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
