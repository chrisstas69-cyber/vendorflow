'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PublicLayout } from '@/components/layout/public-layout';
import { TrustGalleryView } from '@/components/gallery/trust-gallery-view';
import { useGallery } from '@/hooks/use-gallery';
import type { PlatformEvent } from '@/lib/platform-data';
import { CATEGORY_LABELS } from '@/lib/platform-data';
import { ArrowLeft, BadgeCheck, Calendar, MapPin } from 'lucide-react';

interface OrganizerProfile {
  id: string;
  slug: string;
  name: string;
  email: string;
  region?: string | null;
  verified?: boolean;
  tagline?: string;
  seasonLabel?: string;
  events: PlatformEvent[];
}

export default function OrganizerProfilePage({ params }: { params: { slug: string } }) {
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { items, loading: galleryLoading } = useGallery(
    'organizer',
    profile?.id ?? params.slug,
    { publicOnly: true }
  );

  useEffect(() => {
    fetch(`/api/organizers/${params.slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.profile) setProfile(data.profile);
      })
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-sm public-muted">Loading organizer…</div>
      </PublicLayout>
    );
  }

  if (!profile) {
    return (
      <PublicLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold public-heading mb-4">Organizer not found</h1>
          <Link href="/discover" className="text-amber-600 font-semibold hover:underline">
            ← Browse events
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link href="/discover" className="inline-flex items-center gap-1 text-sm public-muted hover:opacity-80 mb-6">
          <ArrowLeft className="h-4 w-4" /> Events
        </Link>

        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold public-heading">{profile.name}</h1>
            {profile.verified && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-teal-100 text-teal-800">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
          </div>
          {profile.tagline && <p className="public-muted">{profile.tagline}</p>}
          <div className="flex flex-wrap gap-4 mt-3 text-sm public-muted">
            {profile.seasonLabel && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {profile.seasonLabel}
              </span>
            )}
            {profile.region && <span>Region: {profile.region}</span>}
          </div>
        </div>

        <TrustGalleryView
          entityType="organizer"
          items={items}
          loading={galleryLoading}
          title={profile.name}
        />

        <div className="mt-8">
          <h2 className="font-bold public-heading mb-4">Upcoming events</h2>
          {profile.events.length === 0 ? (
            <p className="text-sm public-muted">No published events yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {profile.events.map(event => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block rounded-xl border public-card p-4 hover:shadow-md transition-shadow"
                >
                  <div className="text-xs font-medium text-amber-600 mb-1">
                    {CATEGORY_LABELS[event.category]}
                  </div>
                  <div className="font-semibold public-heading">{event.name}</div>
                  <div className="flex items-center gap-3 mt-2 text-xs public-muted">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {event.city}
                    </span>
                  </div>
                  <span className="inline-block mt-3 text-sm font-semibold text-amber-600">
                    Apply →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
