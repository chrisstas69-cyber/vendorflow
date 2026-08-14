'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useDemoStore } from '@/contexts/demo-store-context';
import { PublicLayout } from '@/components/layout/public-layout';
import { CATEGORY_LABELS } from '@/lib/platform-data';
import { TrustGalleryView } from '@/components/gallery/trust-gallery-view';
import { useGallery } from '@/hooks/use-gallery';
import {
  EventInterestButton,
  EventInterestStat,
} from '@/components/public/event-interest-button';
import {
  Calendar,
  MapPin,
  Heart,
  ArrowLeft,
  Star,
} from 'lucide-react';
import { FoundersEditionBanner } from '@/components/founders/founders-banner';
import { EventTrustActions } from '@/components/public/event-trust-actions';

export function EventDetailClient() {
  const params = useParams();
  const id = params.id as string;
  const { getEvent, incrementViews } = useDemoStore();
  const event = getEvent(id);
  const { items: galleryItems, loading: galleryLoading } = useGallery('event', id, {
    publicOnly: true,
  });

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
                {event.isClaimable ? <span className="font-medium vf-text">{event.organizerName}</span> : <Link href="/organizers/hempstead-chamber" className="font-medium vf-text hover:underline">{event.organizerName}</Link>}
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
              <div className="flex gap-3 p-4 rounded-xl border vf-border vf-surface sm:col-span-2">
                <Heart className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold vf-text text-sm">Save this event</div>
                  <div className="text-sm vf-text-muted">Keep the date handy and share it with friends.</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {event.audienceTags.map(tag => (
                <span key={tag} className="vf-bg-subtle vf-text-muted px-3 py-1 text-sm rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <section className="rounded-2xl border vf-border vf-surface p-5">
              <h3 className="font-semibold vf-text">Listing transparency</h3>
              <p className="mt-1 text-sm vf-text-muted">
                {event.isClaimable ? 'Listed from a public source. This event is not yet managed by its organizer on VendorFlow.' : 'Managed or verified through VendorFlow pilot data.'}
              </p>
              <EventTrustActions eventId={event.id} claimable={event.isClaimable} />
            </section>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl border vf-border vf-surface sticky top-24 space-y-3">
              <div className="flex items-center gap-2 font-semibold vf-text mb-1">
                <Calendar className="h-4 w-4 text-orange-600" />
                Going to this event?
              </div>
              <p className="text-xs vf-text-muted">
                Save it or mark interested — organizers and vendors see the demand.
              </p>
              <EventInterestButton eventId={event.id} initialSaves={event.saves} kind="rsvp" />
              <EventInterestButton eventId={event.id} initialSaves={event.saves} kind="save" />

              <div className="border-t vf-border pt-4 mt-2">
                <a
                  href={`/pulse?eventId=${encodeURIComponent(event.id)}`}
                  className="block w-full rounded-xl border border-orange-600 px-4 py-3 text-center text-sm font-semibold text-orange-600 hover:bg-orange-50"
                >
                  Interested in vending? View vendor details
                </a>
                <p className="mt-2 text-center text-xs vf-text-muted">Fees, availability, requirements, and fit insights are shown in the vendor workspace.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </PublicLayout>
  );
}
