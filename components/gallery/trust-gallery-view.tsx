'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import type { GalleryEntityType, GalleryItemRecord, GalleryTag } from '@/lib/gallery-schema';
import { GALLERY_CONTEXT_COPY, GALLERY_TAGS } from '@/lib/gallery-schema';
import { GalleryTagChip } from '@/components/gallery/gallery-tag-chip';
import { TrustGalleryEmptyState } from '@/components/gallery/trust-gallery-empty-state';

interface TrustGalleryViewProps {
  entityType: GalleryEntityType;
  items: GalleryItemRecord[];
  loading?: boolean;
  /** Event name or business name for hero alt text */
  title?: string;
  overlayTitle?: string;
  overlaySubtitle?: string;
  overlayBadge?: React.ReactNode;
  /** Fallback when gallery empty — e.g. event.coverImageUrl */
  fallbackImageUrl?: string;
  showTagFilter?: boolean;
  compact?: boolean;
  className?: string;
}

export function TrustGalleryView({
  entityType,
  items,
  loading,
  title,
  overlayTitle,
  overlaySubtitle,
  overlayBadge,
  fallbackImageUrl,
  showTagFilter = true,
  compact,
  className = '',
}: TrustGalleryViewProps) {
  const copy = GALLERY_CONTEXT_COPY[entityType];
  const publicItems = items.filter(i => i.isPublic);
  const [activeImage, setActiveImage] = useState(0);
  const [tagFilter, setTagFilter] = useState<GalleryTag | null>(null);

  const filtered = useMemo(() => {
    if (!tagFilter) return publicItems;
    return publicItems.filter(i => i.tags.includes(tagFilter));
  }, [publicItems, tagFilter]);

  const displayItems =
    filtered.length > 0
      ? filtered
      : publicItems.length > 0
        ? publicItems
        : fallbackImageUrl
          ? [{ id: 'fallback', imageUrl: fallbackImageUrl, caption: undefined, tags: [] as GalleryTag[], sortOrder: 0, isCover: true, isPublic: true, entityType, entityId: '', createdAt: '', updatedAt: '' }]
          : [];

  const active = displayItems[Math.min(activeImage, displayItems.length - 1)];

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-16 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
      </div>
    );
  }

  if (publicItems.length === 0 && !fallbackImageUrl) {
    return <TrustGalleryEmptyState entityType={entityType} compact={compact} className={className} />;
  }

  return (
    <div className={className}>
      {!compact && !overlayTitle && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold public-heading">{copy.title}</h2>
          <p className="text-sm public-muted mt-1">{copy.subtitle}</p>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden border public-card">
        <div className={`relative ${compact ? 'h-48 md:h-64' : 'h-64 md:h-96'}`}>
          {active && (
            <>
              <Image
                src={active.imageUrl}
                alt={active.caption ?? title ?? 'Event photo'}
                fill
                priority
                className="object-cover"
                sizes="(max-width:768px) 100vw, 896px"
                unoptimized={active.imageUrl.startsWith('data:')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              {overlayBadge && <div className="absolute top-4 left-4">{overlayBadge}</div>}
              {(overlayTitle || active.caption || overlayBadge) && (
                <div className="absolute bottom-4 left-4 right-4">
                  {overlaySubtitle && (
                    <span className="text-amber-300 text-sm font-medium uppercase">{overlaySubtitle}</span>
                  )}
                  {overlayTitle && (
                    <h1 className="text-2xl md:text-4xl font-bold text-white mt-1">{overlayTitle}</h1>
                  )}
                  {active.caption && !overlayTitle && (
                    <p className="text-white text-sm font-medium drop-shadow">{active.caption}</p>
                  )}
                  {active.caption && overlayTitle && (
                    <p className="text-white/90 text-sm mt-2 drop-shadow">{active.caption}</p>
                  )}
                  {!overlayTitle && active.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {active.tags.map(tag => (
                        <GalleryTagChip key={tag} tag={tag} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {displayItems.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto" style={{ background: 'var(--pub-card)' }}>
            {displayItems.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveImage(i)}
                className={`relative shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-opacity ${
                  i === activeImage ? 'border-amber-400 opacity-100' : 'border-transparent opacity-70 hover:opacity-90'
                }`}
              >
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized={item.imageUrl.startsWith('data:')}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {showTagFilter && publicItems.some(i => i.tags.length > 0) && (
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            type="button"
            onClick={() => setTagFilter(null)}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
              tagFilter === null
                ? 'bg-amber-400/90 text-gray-900 font-semibold'
                : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
            }`}
          >
            All
          </button>
          {GALLERY_TAGS.map(tag => {
            const count = publicItems.filter(i => i.tags.includes(tag)).length;
            if (count === 0) return null;
            return (
              <GalleryTagChip
                key={tag}
                tag={tag}
                active={tagFilter === tag}
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                size="md"
              />
            );
          }).filter(Boolean)}
        </div>
      )}
    </div>
  );
}
