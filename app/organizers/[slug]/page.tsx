'use client';

import Link from 'next/link';
import { PublicLayout } from '@/components/layout/public-layout';
import { TrustGalleryView } from '@/components/gallery/trust-gallery-view';
import { useGallery } from '@/hooks/use-gallery';
import { PILOT_ORGANIZER } from '@/lib/pilot-config';
import { DEMO_ORGANIZER_ID } from '@/lib/platform-data';
import { ArrowLeft, BadgeCheck, Calendar } from 'lucide-react';

const SLUG_MAP: Record<string, string> = {
  'hempstead-chamber': DEMO_ORGANIZER_ID,
  'org-demo': DEMO_ORGANIZER_ID,
};

export default function OrganizerProfilePage({ params }: { params: { slug: string } }) {
  const organizerId = SLUG_MAP[params.slug] ?? params.slug;
  const profile = organizerId === DEMO_ORGANIZER_ID ? PILOT_ORGANIZER : null;
  const { items, loading } = useGallery('organizer', organizerId, { publicOnly: true });

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
            <h1 className="text-2xl md:text-3xl font-bold public-heading">{profile.organization}</h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-teal-100 text-teal-800">
              <BadgeCheck className="h-3.5 w-3.5" /> Founders Edition
            </span>
          </div>
          <p className="public-muted">{profile.tagline}</p>
          <div className="flex flex-wrap gap-4 mt-3 text-sm public-muted">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4" /> {profile.seasonLabel}
            </span>
            <span>Region: {profile.region}</span>
          </div>
        </div>

        <TrustGalleryView
          entityType="organizer"
          items={items}
          loading={loading}
          title={profile.organization}
        />

        <div className="mt-8 p-5 rounded-2xl border public-card">
          <h2 className="font-semibold public-heading mb-2">Why vendors trust us</h2>
          <ul className="text-sm public-muted space-y-2 list-disc list-inside">
            <li>Real photos from past street fairs and expos — not stock flyers</li>
            <li>Transparent booth fees and documented vendor approval process</li>
            <li>Long Island compliance support for Nassau &amp; Suffolk vendors</li>
          </ul>
          <Link
            href="/discover"
            className="inline-block mt-4 text-sm font-semibold text-amber-600 hover:underline"
          >
            Browse upcoming events →
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
