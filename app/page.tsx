'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  Calendar,
  MapPin,
  Users,
  Sparkles,
  Compass,
  Store,
  Building2,
  CheckCircle2,
  Instagram,
} from 'lucide-react';
import { useDemoStore } from '@/contexts/demo-store-context';
import { PublicLayout } from '@/components/layout/public-layout';
import { PublicEventCard } from '@/components/public/event-card';
import { mockShowcaseProfiles } from '@/lib/event-images';
import { BROWSE_CATEGORIES, mockAmbassadors } from '@/lib/documents';
import { CATEGORY_LABELS, type PlatformEvent } from '@/lib/platform-data';

export default function HomePage() {
  const { publishedEvents } = useDemoStore();

  const spotlight =
    publishedEvents.find(e => e.promotionTier === 'spotlight') ?? publishedEvents[0];
  const featured = publishedEvents.filter(
    e => e.promotionTier === 'featured' || e.promotionTier === 'spotlight'
  );
  const thisWeek = useMemo(() => {
    const now = new Date('2026-03-01');
    return publishedEvents.filter(e => {
      const d = new Date(e.date);
      const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 14;
    });
  }, [publishedEvents]);

  const rest = (thisWeek.length > 0 ? thisWeek : publishedEvents)
    .filter(e => e.id !== spotlight?.id)
    .slice(0, 6);

  const vendorShowcase = mockShowcaseProfiles.filter(p => p.type === 'vendor').slice(0, 3);
  const organizerShowcase = mockShowcaseProfiles.filter(p => p.type === 'organizer').slice(0, 3);

  return (
    <PublicLayout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border vf-border vf-surface px-3 py-1 text-[11px] font-medium vf-text-muted mb-5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
                </span>
                Founders Edition · Long Island Pilot
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold vf-text tracking-tight leading-[1.05]">
                Event vendor{' '}
                <span className="bg-gradient-to-r from-orange-600 via-amber-700 to-orange-800 bg-clip-text text-transparent">
                  intelligence
                </span>{' '}
                for NY &amp; NJ
              </h1>
              <p className="mt-5 text-base sm:text-lg vf-text-muted leading-relaxed max-w-xl">
                Discover fairs, festivals, car shows, and markets across New York &amp; New Jersey.
                Real booths, real crowds — apply to vendor spots in seconds.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/discover"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 text-sm font-semibold transition-colors shadow-lg shadow-orange-600/20"
                >
                  <Compass size={16} /> Discover events
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/for-organizers"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border vf-border vf-surface hover:vf-surface-2 vf-text px-5 py-2.5 text-sm font-semibold transition-colors"
                >
                  <Building2 size={16} /> I&apos;m an organizer
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs vf-text-muted">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-orange-600" /> 6k+ live events
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-orange-600" /> 40k+ vendors
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-orange-600" /> Alpha scores
                </div>
              </div>
            </div>

            {spotlight && (
              <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
                <FeaturedSpotlightCard event={spotlight} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-y vf-border vf-bg-subtle">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold vf-text tracking-tight">Browse by type</h2>
              <p className="text-xs vf-text-muted mt-1">Find the right fair, festival, or market</p>
            </div>
            <Link
              href="/discover"
              className="text-xs font-medium text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
            >
              See all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {BROWSE_CATEGORIES.map(c => (
              <Link
                key={c.id}
                href={c.id === 'all' ? '/discover' : `/discover?category=${c.id}`}
                className="group rounded-xl border vf-border vf-surface hover:vf-surface-2 hover:border-orange-500/40 p-4 transition-all hover:-translate-y-0.5"
              >
                <div className="text-2xl mb-2">{c.icon}</div>
                <div className="text-xs font-medium vf-text">{c.label}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HAPPENING SOON */}
      {rest.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold vf-text tracking-tight">Happening soon</h2>
              <p className="text-xs vf-text-muted mt-1">Across NY &amp; NJ — this week &amp; next</p>
            </div>
            <Link
              href="/discover"
              className="text-xs font-medium text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
            >
              See all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rest.map(event => (
              <PublicEventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* MEET THE VENDORS */}
      <section className="border-y vf-border vf-bg-subtle">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold vf-text tracking-tight">Meet the vendors</h2>
            <p className="text-sm vf-text-muted mt-2">
              Real booths, real crowds — see who&apos;s setting up at fairs near you
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vendorShowcase.map((v, i) => (
              <Link
                key={v.id}
                href={v.href}
                className="group rounded-2xl border vf-border vf-surface overflow-hidden hover:border-orange-500/40 transition-all hover:-translate-y-0.5 animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="relative h-36 overflow-hidden">
                  <Image
                    src={v.imageUrl}
                    alt={v.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="33vw"
                  />
                </div>
                <div className="p-4">
                  <span className="text-[10px] font-medium uppercase tracking-wider vf-text-muted">
                    vendor
                  </span>
                  <p className="text-sm font-semibold vf-text mt-0.5">{v.name}</p>
                  <p className="text-xs vf-text-muted mt-1 leading-relaxed line-clamp-2">
                    {v.subtitle}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold vf-text tracking-tight">Featured events</h2>
            <p className="text-xs vf-text-muted mt-1">
              Organizers can promote listings to the top banner &amp; featured row
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(featured.length > 0 ? featured : publishedEvents.slice(0, 3)).map((event, i) => (
            <PublicEventCard
              key={event.id}
              event={event}
              size={i === 0 ? 'large' : 'default'}
            />
          ))}
        </div>
      </section>

      {/* ORGANIZERS */}
      <section className="border-y vf-border vf-bg-subtle">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold vf-text tracking-tight">
              Organizers on VendorFlow
            </h2>
            <p className="text-sm vf-text-muted mt-2">
              Aerial shots, street fairs packed with thousands — your event could be here
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {organizerShowcase.map((o, i) => (
              <Link
                key={o.id}
                href={o.href}
                className="group rounded-2xl border vf-border vf-surface overflow-hidden hover:border-orange-500/40 transition-all hover:-translate-y-0.5 animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="relative h-36 overflow-hidden">
                  <Image
                    src={o.imageUrl}
                    alt={o.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="33vw"
                  />
                </div>
                <div className="p-4">
                  <span className="text-[10px] font-medium uppercase tracking-wider vf-text-muted">
                    organizer
                  </span>
                  <p className="text-sm font-semibold vf-text mt-0.5">{o.name}</p>
                  <p className="text-xs vf-text-muted mt-1 leading-relaxed line-clamp-2">
                    {o.subtitle}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AMBASSADORS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold vf-text tracking-tight">Event Ambassadors</h2>
          <p className="text-sm vf-text-muted mt-2 max-w-2xl mx-auto">
            Local influencers help pack the crowd — organizers can invite ambassadors to promote
            listings
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockAmbassadors.map((a, i) => (
            <div
              key={a.id}
              className="group rounded-2xl border vf-border vf-surface overflow-hidden hover:border-orange-500/40 transition-all hover:-translate-y-0.5 animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="relative h-32 overflow-hidden">
                <Image
                  src={a.imageUrl}
                  alt={a.name}
                  fill
                  className="object-cover"
                  sizes="33vw"
                />
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold vf-text">{a.name}</p>
                <p className="text-xs text-orange-600 flex items-center gap-1 mt-0.5">
                  <Instagram size={12} /> {a.handle}
                </p>
                <p className="text-xs vf-text-muted mt-2 leading-relaxed">{a.specialty}</p>
                <div className="mt-3 flex items-center gap-4 text-[11px] vf-text-subtle">
                  <span className="flex items-center gap-1">
                    <Users size={11} /> {a.followers} followers
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> {a.eventsPromoted} events
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA SPLIT */}
      <section className="border-t vf-border vf-bg-subtle">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/for-vendors"
              className="group relative overflow-hidden rounded-2xl border vf-border vf-surface p-7 hover:border-orange-500/40 transition-all hover:-translate-y-0.5"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl group-hover:bg-orange-500/20 transition-colors" />
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white mb-4">
                  <Store size={18} />
                </div>
                <h3 className="text-lg font-semibold vf-text">I&apos;m a vendor</h3>
                <p className="text-sm vf-text-muted mt-1.5 leading-relaxed">
                  Alpha scores, ROI intel, one-click applications
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-orange-600">
                  Open vendor tools <ArrowRight size={12} />
                </span>
              </div>
            </Link>
            <Link
              href="/for-organizers"
              className="group relative overflow-hidden rounded-2xl border vf-border vf-surface p-7 hover:border-orange-500/40 transition-all hover:-translate-y-0.5"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white mb-4">
                  <Building2 size={18} />
                </div>
                <h3 className="text-lg font-semibold vf-text">I&apos;m an organizer</h3>
                <p className="text-sm vf-text-muted mt-1.5 leading-relaxed">
                  List your fair, upload photos, fill vendor slots
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                  Organizer hub <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function FeaturedSpotlightCard({ event }: { event: PlatformEvent }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="group relative block overflow-hidden rounded-2xl border vf-border vf-surface shadow-xl"
      style={{ boxShadow: '0 20px 40px var(--vf-shadow-strong)' }}
    >
      <div className="aspect-[4/3] sm:aspect-[16/10] relative overflow-hidden">
        <Image
          src={event.coverImageUrl}
          alt={event.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-semibold text-white">
          <Sparkles size={10} /> Featured Spotlight
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/70">
            {CATEGORY_LABELS[event.category]}
          </span>
          <h3 className="text-xl font-bold mt-1">{event.name}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-white/80">
            <span className="flex items-center gap-1">
              <Calendar size={11} />{' '}
              {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={11} /> {event.city}, {event.state}
            </span>
            <span className="flex items-center gap-1">
              <Users size={11} /> {event.footTraffic}
            </span>
          </div>
        </div>
      </div>
      <div className="p-4 flex items-center justify-between">
        <span className="text-xs vf-text-muted">{event.organizerName}</span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 group-hover:gap-2 transition-all">
          See event details <ArrowRight size={12} />
        </span>
      </div>
    </Link>
  );
}
