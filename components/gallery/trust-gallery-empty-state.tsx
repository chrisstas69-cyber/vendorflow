'use client';

import { Camera, ImagePlus } from 'lucide-react';
import type { GalleryEntityType } from '@/lib/gallery-schema';
import { GALLERY_CONTEXT_COPY } from '@/lib/gallery-schema';

interface TrustGalleryEmptyStateProps {
  entityType: GalleryEntityType;
  onUpload?: () => void;
  compact?: boolean;
  className?: string;
}

export function TrustGalleryEmptyState({
  entityType,
  onUpload,
  compact,
  className = '',
}: TrustGalleryEmptyStateProps) {
  const copy = GALLERY_CONTEXT_COPY[entityType];

  return (
    <div
      className={`rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-700 p-6 md:p-8 text-center ${className}`}
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/40 mb-4">
        {compact ? (
          <ImagePlus className="h-6 w-6 text-amber-600" />
        ) : (
          <Camera className="h-6 w-6 text-amber-600" />
        )}
      </div>
      <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">{copy.emptyTitle}</h3>
      <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto mb-4">
        {copy.emptyDescription}
      </p>
      <p className="text-xs text-stone-500 mb-4">Aim for 5–10 real photos from past events — not flyers or graphics.</p>
      {onUpload && (
        <button
          type="button"
          onClick={onUpload}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-gray-900 text-sm font-semibold transition-colors"
        >
          <Camera className="h-4 w-4" /> Add your first photo
        </button>
      )}
    </div>
  );
}
