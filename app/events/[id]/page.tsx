'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useDemoStore } from '@/contexts/demo-store-context';
import { PublicLayout } from '@/components/layout/public-layout';
import { CATEGORY_LABELS } from '@/lib/platform-data';
import { SetupPhotoUpload } from '@/components/vendor/setup-photo-upload';
import { Calendar, MapPin, Users, Clock, Store, ArrowLeft, CheckCircle, Star } from 'lucide-react';

export default function EventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { getEvent, incrementViews, submitVendorApplication } = useDemoStore();
  const event = getEvent(id);

  const [activeImage, setActiveImage] = useState(0);
  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({
    vendorName: 'Demo Vendor Co.',
    vendorEmail: 'vendor@demo.vendorflow.app',
    category: 'LED Toys',
    message: '',
    hasInsurance: true,
    setupPhotoUrl: undefined as string | undefined,
  });
  const [result, setResult] = useState('');

  useEffect(() => {
    if (event) incrementViews(event.id);
  }, [event, incrementViews]);

  if (!event) {
    return (
      <PublicLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold public-heading mb-4">Event not found</h1>
          <Link href="/discover" className="text-amber-600 font-semibold hover:underline">
            ← Back to discover
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const images = event.galleryUrls.length > 0 ? event.galleryUrls : [event.coverImageUrl];

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const res = submitVendorApplication({ eventId: event.id, ...form });
    setResult(res.message);
    if (res.ok) setShowApply(false);
  };

  const slotsLeft = event.vendorSlots - event.vendorSlotsFilled;

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link href="/discover" className="inline-flex items-center gap-1 text-sm public-muted hover:opacity-80 mb-4">
          <ArrowLeft className="h-4 w-4" /> All events
        </Link>

        {/* Photo gallery hero */}
        <div className="rounded-2xl overflow-hidden border public-card mb-6">
          <div className="relative h-64 md:h-96">
            <Image
              src={images[activeImage]}
              alt={event.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width:768px) 100vw, 896px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            {event.promotionTier !== 'none' && (
              <div className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400 text-gray-900 text-xs font-bold">
                <Star className="h-3 w-3" />
                {event.promotionTier === 'spotlight' ? 'SPONSORED SPOTLIGHT' : 'FEATURED'}
              </div>
            )}
            <div className="absolute bottom-4 left-4 right-4">
              <span className="text-amber-300 text-sm font-medium uppercase">
                {CATEGORY_LABELS[event.category]}
              </span>
              <h1 className="text-2xl md:text-4xl font-bold text-white mt-1">{event.name}</h1>
            </div>
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto" style={{ background: 'var(--pub-card)' }}>
              {images.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`relative shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 ${
                    i === activeImage ? 'border-amber-400' : 'border-transparent opacity-70'
                  }`}
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div>
              <p className="public-muted mb-4">
                Hosted by <span className="font-medium public-heading">{event.organizerName}</span>
              </p>
              <p className="public-heading leading-relaxed">{event.description}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex gap-3 p-4 rounded-xl border public-card">
                <Calendar className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold public-heading text-sm">
                    {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  {event.time && <div className="text-sm public-muted">{event.time}</div>}
                </div>
              </div>
              <div className="flex gap-3 p-4 rounded-xl border public-card">
                <MapPin className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold public-heading text-sm">{event.location}</div>
                  <div className="text-sm public-muted">{event.city}, {event.state}</div>
                </div>
              </div>
              <div className="flex gap-3 p-4 rounded-xl border public-card">
                <Users className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold public-heading text-sm">{event.footTraffic} expected</div>
                  <div className="text-sm public-muted">{event.familyDensity}% family-friendly</div>
                </div>
              </div>
              {event.applicationDeadline && (
                <div className="flex gap-3 p-4 rounded-xl border public-card">
                  <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold public-heading text-sm">Vendor deadline</div>
                    <div className="text-sm public-muted">
                      {new Date(event.applicationDeadline).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {event.audienceTags.map(tag => (
                <span key={tag} className="public-tag px-3 py-1 text-sm rounded-full">{tag}</span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl border public-card sticky top-24">
              <div className="flex items-center gap-2 font-semibold public-heading mb-2">
                <Store className="h-4 w-4 text-amber-500" />
                Vendor booths
              </div>
              <p className="text-sm public-muted mb-4">
                ${event.boothFee} booth fee
                {event.permitFee > 0 ? ` + $${event.permitFee} permit` : ''}
                <br />
                {slotsLeft} slots remaining
              </p>
              <button
                type="button"
                onClick={() => setShowApply(true)}
                className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold rounded-xl transition-colors"
              >
                Apply as Vendor
              </button>
              <Link
                href="/pulse"
                className="block text-center text-sm public-muted mt-3 hover:underline"
              >
                Vendor intel &amp; ROI →
              </Link>
            </div>
          </div>
        </div>

        {result && (
          <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            {result}
            <Link href="/command" className="ml-auto font-semibold underline">Command →</Link>
          </div>
        )}

        {showApply && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <form onSubmit={handleApply} className="public-card border rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold public-heading mb-4">Vendor Application</h2>
              <p className="text-sm public-muted mb-4">{event.name}</p>
              <div className="space-y-3">
                {(['vendorName', 'vendorEmail', 'category'] as const).map(field => (
                  <input
                    key={field}
                    required
                    placeholder={field === 'vendorName' ? 'Business name' : field === 'vendorEmail' ? 'Email' : 'Product category'}
                    className="w-full px-3 py-2 border public-input rounded-lg"
                    value={form[field]}
                    onChange={e => setForm({ ...form, [field]: e.target.value })}
                  />
                ))}
                <SetupPhotoUpload
                  value={form.setupPhotoUrl}
                  onChange={setupPhotoUrl => setForm({ ...form, setupPhotoUrl })}
                />
                <textarea
                  placeholder="Tell the organizer about your setup..."
                  rows={3}
                  className="w-full px-3 py-2 border public-input rounded-lg"
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                />
                <label className="flex items-center gap-2 text-sm public-muted">
                  <input
                    type="checkbox"
                    checked={form.hasInsurance}
                    onChange={e => setForm({ ...form, hasInsurance: e.target.checked })}
                  />
                  I have general liability insurance (COI available)
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowApply(false)} className="flex-1 py-2 border public-input rounded-lg font-medium">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-amber-400 hover:bg-amber-500 rounded-lg font-semibold text-gray-900">
                  Submit
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
