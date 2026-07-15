'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, Star, Sparkles, ExternalLink } from 'lucide-react';
import type { EventListing } from '@/lib/marketplace';
import type { PlatformEvent } from '@/lib/platform-data';
import { platformEventToListing } from '@/lib/marketplace';
import { EventInterestButton } from '@/components/public/event-interest-button';

export type EventListingCardSize = 'default' | 'large' | 'compact';

export interface EventListingCardProps {
  listing?: EventListing;
  event?: PlatformEvent;
  size?: EventListingCardSize;
  showFeaturedBadge?: boolean;
  className?: string;
}

export function EventListingCard({
  listing: listingProp,
  event,
  size = 'default',
  showFeaturedBadge = true,
  className = '',
}: EventListingCardProps) {
  const listing = listingProp ?? (event ? platformEventToListing(event) : null);
  if (!listing) return null;

  const isLarge = size === 'large';
  const isCompact = size === 'compact';
  const isExternal = listing.href.startsWith('http');
  const imageHeight = isLarge ? 256 : isCompact ? 144 : 192;
  const showInterest = listing.source === 'platform' && !isExternal && !isCompact;

  const cardClass = `group relative block overflow-hidden rounded-2xl border vf-border vf-surface transition-all duration-300 hover:border-orange-500/40 hover:-translate-y-0.5 animate-fade-up ${
    isLarge ? 'col-span-1 md:col-span-2' : ''
  } ${className}`;

  const body = (
    <>
      <div
        className={`relative overflow-hidden ${isLarge ? 'h-64 md:h-72' : isCompact ? 'h-36' : 'h-48'}`}
        style={{ position: 'relative', width: '100%', height: imageHeight, overflow: 'hidden' }}
      >
        <Image
          src={listing.imageUrl}
          alt={listing.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={isLarge ? '(max-width:768px) 100vw, 50vw' : '(max-width:768px) 100vw, 33vw'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {listing.source === 'sqlite' && (
          <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-black/50 backdrop-blur text-white">
            Scraped
          </span>
        )}
        {showFeaturedBadge && listing.promotionTier !== 'none' && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-600 text-white text-[10px] font-bold shadow">
            {listing.promotionTier === 'spotlight' ? (
              <>
                <Sparkles className="h-3 w-3" /> SPONSORED
              </>
            ) : (
              <>
                <Star className="h-3 w-3" /> FEATURED
              </>
            )}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <span className="text-[10px] font-medium text-orange-200 uppercase tracking-wide">
            {listing.categoryLabel}
          </span>
          <h3
            className={`font-bold text-white leading-tight mt-0.5 ${isLarge ? 'text-2xl md:text-3xl' : 'text-lg'}`}
          >
            {listing.title}
          </h3>
        </div>
      </div>
      {!isCompact && (
        <div className="p-4 pr-14 vf-surface">
          <div className="flex items-center gap-3 text-sm vf-text-muted mb-2">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {listing.date
                ? new Date(listing.date + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Date TBA'}
            </span>
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {listing.locationLabel}
            </span>
            {isExternal && <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {listing.tags.slice(0, 4).map(tag => (
              <span
                key={tag}
                className="vf-bg-subtle vf-text-muted px-2 py-0.5 text-[10px] rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );

  const interestBtn = showInterest ? (
    <div
      className="absolute bottom-3 right-3 z-10"
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <EventInterestButton
        eventId={listing.id}
        initialSaves={listing.saves}
        kind="save"
        compact
      />
    </div>
  ) : null;

  if (isExternal) {
    return (
      <a href={listing.href} target="_blank" rel="noopener noreferrer" className={cardClass}>
        {body}
      </a>
    );
  }

  return (
    <div className={cardClass}>
      <Link href={listing.href} className="block">
        {body}
      </Link>
      {interestBtn}
    </div>
  );
}
