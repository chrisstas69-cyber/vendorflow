'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, Star, Sparkles } from 'lucide-react';
import type { PlatformEvent } from '@/lib/platform-data';
import { CATEGORY_LABELS } from '@/lib/platform-data';

interface PublicEventCardProps {
  event: PlatformEvent;
  size?: 'default' | 'large' | 'compact';
  showFeaturedBadge?: boolean;
}

export function PublicEventCard({ event, size = 'default', showFeaturedBadge = true }: PublicEventCardProps) {
  const isLarge = size === 'large';
  const isCompact = size === 'compact';

  return (
    <Link
      href={`/events/${event.id}`}
      className={`group block overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 public-card ${
        isLarge ? 'col-span-1 md:col-span-2' : ''
      }`}
    >
      <div
        className={`relative overflow-hidden ${isLarge ? 'h-64 md:h-72' : isCompact ? 'h-36' : 'h-48'}`}
        style={{
          position: 'relative',
          width: '100%',
          height: isLarge ? 256 : isCompact ? 144 : 192,
          overflow: 'hidden',
        }}
      >
        <Image
          src={event.coverImageUrl}
          alt={event.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={isLarge ? '(max-width:768px) 100vw, 50vw' : '(max-width:768px) 100vw, 33vw'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {showFeaturedBadge && event.promotionTier !== 'none' && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 text-gray-900 text-xs font-bold shadow">
            {event.promotionTier === 'spotlight' ? (
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
          <span className="text-xs font-medium text-amber-300 uppercase tracking-wide">
            {CATEGORY_LABELS[event.category]}
          </span>
          <h3 className={`font-bold text-white leading-tight mt-0.5 ${isLarge ? 'text-2xl md:text-3xl' : 'text-lg'}`}>
            {event.name}
          </h3>
        </div>
      </div>
      {!isCompact && (
        <div className="p-4 public-card-body">
          <div className="flex items-center gap-3 text-sm public-muted mb-2">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {event.city}, {event.state}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {event.audienceTags.slice(0, 3).map(tag => (
              <span key={tag} className="public-tag px-2 py-0.5 text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </Link>
  );
}
