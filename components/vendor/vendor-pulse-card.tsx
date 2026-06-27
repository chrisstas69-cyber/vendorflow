'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, TrendingUp, DollarSign } from 'lucide-react';
import { TierBadge } from '@/components/tier-badge';
import type { PlatformEvent } from '@/lib/platform-data';
import { CATEGORY_LABELS } from '@/lib/platform-data';

interface VendorPulseCardProps {
  event: PlatformEvent;
  onApply?: (event: PlatformEvent) => void;
  applying?: boolean;
  inPipeline?: boolean;
}

export function VendorPulseCard({ event, onApply, applying, inPipeline }: VendorPulseCardProps) {
  const totalFees = event.boothFee + event.permitFee;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      <Link href={`/events/${event.id}`} className="relative block h-40 overflow-hidden group">
        <Image
          src={event.coverImageUrl}
          alt={event.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width:768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-3 left-3">
          <TierBadge tier={event.tier} size="sm" />
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <span className="text-xs font-medium text-amber-300">{CATEGORY_LABELS[event.category]}</span>
          <h3 className="text-lg font-bold text-white leading-tight">{event.name}</h3>
        </div>
      </Link>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <span className="flex items-center gap-1 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {event.city}, {event.state}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2">
            <div className="text-lg font-bold text-amber-600">{event.alphaScore}</div>
            <div className="text-[10px] uppercase text-gray-500">Score</div>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-2">
            <div className="text-sm font-bold">${event.roiMax.toLocaleString()}</div>
            <div className="text-[10px] uppercase text-gray-500 flex items-center justify-center gap-0.5">
              <TrendingUp className="h-2.5 w-2.5" /> ROI max
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-2">
            <div className="text-sm font-bold">${totalFees}</div>
            <div className="text-[10px] uppercase text-gray-500">Fees</div>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{event.description}</p>

        <div className="flex flex-wrap gap-1 mb-4">
          {event.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600">
              {tag}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onApply?.(event)}
          disabled={applying || inPipeline}
          className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm bg-amber-400 hover:bg-amber-500 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <DollarSign className="h-4 w-4" />
          {inPipeline ? 'In your pipeline' : applying ? 'Adding…' : 'Add to pipeline'}
        </button>
      </div>
    </div>
  );
}
