'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, Store, Building2 } from 'lucide-react';
import { PublicLayout } from '@/components/layout/public-layout';
import { DiscoverExplore } from '@/components/discover/discover-explore';

export default function HomePage() {
  return (
    <PublicLayout>
      {/* Browse-first hero — Eventbrite-simple discovery */}
      <section className="border-b vf-border vf-bg-subtle">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-6 animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border vf-border vf-surface px-3 py-1 text-[11px] font-medium vf-text-muted mb-4">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
            </span>
            NY &amp; NJ · Founders Edition
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold vf-text tracking-tight leading-[1.1] max-w-3xl">
            Find car shows, farmers markets &amp; street fairs near you
          </h1>
          <p className="mt-3 text-sm sm:text-base vf-text-muted max-w-2xl leading-relaxed">
            Browse by town and type. Free to explore. Vendors and organizers get the tools Eventbrite
            never built.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            {[
              { label: 'Long Island', href: '/discover?state=NY' },
              { label: 'New Jersey', href: '/discover?state=NJ' },
              { label: 'Car shows', href: '/discover?category=car-show' },
              { label: 'Farmers markets', href: '/discover?category=farmers-market' },
              { label: 'Street fairs', href: '/discover?category=street-fair' },
            ].map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full border vf-border vf-surface px-3 py-1.5 vf-text-muted hover:border-orange-500/40 hover:vf-text transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<p className="vf-text-muted text-sm py-12 text-center">Loading events…</p>}>
          <DiscoverExplore
            pageTitle="Happening near you"
            pageDescription="Filter by category, town, or search — then save what you want to go to."
          />
        </Suspense>
      </div>

      {/* Role CTAs — below the fold */}
      <section className="border-t vf-border vf-bg-subtle">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/for-vendors"
              className="group relative overflow-hidden rounded-2xl border vf-border vf-surface p-6 hover:border-orange-500/40 transition-all hover:-translate-y-0.5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white mb-3">
                <Store size={18} />
              </div>
              <h2 className="text-lg font-semibold vf-text">I&apos;m a vendor</h2>
              <p className="text-sm vf-text-muted mt-1">
                See which fairs people are saving — apply with your passport in one click.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-orange-600">
                Vendor tools <ArrowRight size={12} />
              </span>
            </Link>
            <Link
              href="/for-organizers"
              className="group relative overflow-hidden rounded-2xl border vf-border vf-surface p-6 hover:border-emerald-500/40 transition-all hover:-translate-y-0.5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white mb-3">
                <Building2 size={18} />
              </div>
              <h2 className="text-lg font-semibold vf-text">I&apos;m an organizer</h2>
              <p className="text-sm vf-text-muted mt-1">
                List your fair, fill booths with a drag-and-drop pipeline, prove interest before the day.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                Organizer hub <ArrowRight size={12} />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
