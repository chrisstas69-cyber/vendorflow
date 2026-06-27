'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { PlatformEvent } from '@/lib/platform-data';
import { CATEGORY_LABELS } from '@/lib/platform-data';

export function FeaturedSpotlightBanner({ event }: { event: PlatformEvent }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="block relative group overflow-hidden rounded-2xl md:rounded-3xl isolate"
      style={{
        minHeight: 320,
        position: 'relative',
        display: 'block',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <Image
          src={event.coverImageUrl}
          alt={event.name}
          fill
          priority
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 1152px"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 max-w-2xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-gray-900 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            Featured Spotlight
          </span>
          <span className="text-xs text-white/70">Paid placement · Demo</span>
        </div>
        <p className="text-amber-300 text-sm font-medium uppercase tracking-wide mb-1">
          {CATEGORY_LABELS[event.category]} · {event.footTraffic} expected
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">
          {event.name}
        </h2>
        <p className="text-white/80 text-sm md:text-base mb-6 line-clamp-2 max-w-lg">
          {event.description}
        </p>
        <span className="inline-flex items-center gap-2 w-fit px-5 py-2.5 bg-white text-gray-900 font-semibold rounded-xl group-hover:bg-amber-400 transition-colors">
          See event details
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
