'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useDemoStore } from '@/contexts/demo-store-context';
import { PublicLayout } from '@/components/layout/public-layout';
import { PublicEventCard } from '@/components/public/event-card';
import { FeaturedSpotlightBanner } from '@/components/public/featured-banner';
import { ShowcaseRow } from '@/components/public/showcase-row';
import { mockShowcaseProfiles } from '@/lib/event-images';
import { BROWSE_CATEGORIES, mockAmbassadors, type BrowseCategoryId } from '@/lib/documents';
import { Search, ArrowRight, Store, Users, Instagram } from 'lucide-react';
import { SafeImageFrame } from '@/components/public/safe-image-frame';

export default function HomePage() {
  const { publishedEvents } = useDemoStore();
  const router = useRouter();
  const [browseCat, setBrowseCat] = useState<BrowseCategoryId>('all');

  const spotlight = publishedEvents.find(e => e.promotionTier === 'spotlight') ?? publishedEvents[0];
  const featured = publishedEvents.filter(e => e.promotionTier === 'featured' || e.promotionTier === 'spotlight');
  const thisWeek = useMemo(() => {
    const now = new Date('2026-03-01');
    return publishedEvents.filter(e => {
      const d = new Date(e.date);
      const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 14;
    });
  }, [publishedEvents]);

  const vendorShowcase = mockShowcaseProfiles.filter(p => p.type === 'vendor');
  const organizerShowcase = mockShowcaseProfiles.filter(p => p.type === 'organizer');

  return (
    <PublicLayout>
      {/* Hero spotlight — paid top banner slot */}
      <section className="max-w-6xl mx-auto px-4 pt-6 pb-4">
        {spotlight && <FeaturedSpotlightBanner event={spotlight} />}
      </section>

      {/* Browse by type */}
      <section className="max-w-6xl mx-auto px-4 py-4">
        <h2 className="text-lg font-bold public-heading mb-3">Browse by type</h2>
        <div className="flex flex-wrap gap-2">
          {BROWSE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setBrowseCat(cat.id);
                if (cat.id !== 'all') {
                  router.push(`/discover?category=${cat.id}`);
                }
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                browseCat === cat.id
                  ? 'bg-amber-400 border-amber-400 text-gray-900'
                  : 'public-card public-muted hover:border-amber-400/50'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Search CTA */}
      <section className="max-w-6xl mx-auto px-4 py-6">
        <Link
          href="/discover"
          className="flex items-center gap-3 px-5 py-4 rounded-2xl border public-card public-muted hover:border-amber-400/50 transition-colors"
        >
          <Search className="h-5 w-5 shrink-0" />
          <span className="flex-1 text-left">Search fairs, festivals, markets near you…</span>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
      </section>

      {/* This week — image cards */}
      {thisWeek.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold public-heading">This week &amp; next</h2>
              <p className="public-muted text-sm mt-1">Happening soon across NY &amp; NJ</p>
            </div>
            <Link href="/discover" className="text-sm font-semibold text-amber-600 hover:underline">
              See all →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {thisWeek.slice(0, 6).map(event => (
              <PublicEventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* Vendor showcase — tents, booths, food */}
      <section className="max-w-6xl mx-auto px-4">
        <ShowcaseRow
          title="Meet the vendors"
          subtitle="Real booths, real crowds — see who's setting up at fairs near you"
          profiles={vendorShowcase}
        />
      </section>

      {/* Featured / promoted grid */}
      <section className="max-w-6xl mx-auto px-4 py-4">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold public-heading">Featured events</h2>
          <p className="public-muted text-sm mt-1">Organizers can promote listings to the top banner &amp; featured row</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(featured.length > 0 ? featured : publishedEvents.slice(0, 3)).map((event, i) => (
            <PublicEventCard key={event.id} event={event} size={i === 0 ? 'large' : 'default'} />
          ))}
        </div>
      </section>

      {/* Organizer showcase — aerials, crowds */}
      <section className="max-w-6xl mx-auto px-4">
        <ShowcaseRow
          title="Organizers on VendorFlow"
          subtitle="Aerial shots, street fairs packed with thousands — your event could be here"
          profiles={organizerShowcase}
        />
      </section>

      {/* Event Ambassadors — influencers */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold public-heading">Event Ambassadors</h2>
          <p className="public-muted text-sm mt-1">
            Local influencers help pack the crowd — organizers can invite ambassadors to promote listings
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {mockAmbassadors.map(amb => (
            <div key={amb.id} className="rounded-2xl border public-card overflow-hidden">
              <SafeImageFrame src={amb.imageUrl} alt={amb.name} height={128} sizes="33vw" />
              <div className="p-4">
                <div className="font-bold public-heading">{amb.name}</div>
                <div className="text-sm text-amber-600 flex items-center gap-1 mt-0.5">
                  <Instagram className="h-3.5 w-3.5" /> {amb.handle}
                </div>
                <p className="text-xs public-muted mt-2">{amb.specialty}</p>
                <div className="flex gap-3 mt-3 text-xs public-muted">
                  <span>{amb.followers} followers</span>
                  <span>{amb.eventsPromoted} events promoted</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Audience CTAs */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/for-vendors"
            className="group relative overflow-hidden rounded-2xl min-h-[200px] flex items-end p-6 border public-card hover:border-amber-400/50 transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent" />
            <div className="relative">
              <Store className="h-8 w-8 text-amber-500 mb-2" />
              <h3 className="text-xl font-bold public-heading mb-1">I&apos;m a vendor</h3>
              <p className="text-sm public-muted mb-3">Alpha scores, ROI intel, one-click applications</p>
              <span className="text-sm font-semibold text-amber-600 group-hover:underline">Open vendor tools →</span>
            </div>
          </Link>
          <Link
            href="/for-organizers"
            className="group relative overflow-hidden rounded-2xl min-h-[200px] flex items-end p-6 border public-card hover:border-indigo-400/50 transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent" />
            <div className="relative">
              <Users className="h-8 w-8 text-indigo-500 mb-2" />
              <h3 className="text-xl font-bold public-heading mb-1">I&apos;m an organizer</h3>
              <p className="text-sm public-muted mb-3">List your fair, upload photos, fill vendor slots</p>
              <span className="text-sm font-semibold text-indigo-600 group-hover:underline">Organizer hub →</span>
            </div>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
