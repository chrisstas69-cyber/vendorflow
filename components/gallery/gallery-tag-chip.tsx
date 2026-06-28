'use client';

import type { GalleryTag } from '@/lib/gallery-schema';
import { GALLERY_TAG_LABELS } from '@/lib/gallery-schema';

interface GalleryTagChipProps {
  tag: GalleryTag;
  active?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function GalleryTagChip({ tag, active, onClick, size = 'sm' }: GalleryTagChipProps) {
  const base =
    size === 'sm'
      ? 'text-[10px] px-2 py-0.5 rounded-full'
      : 'text-xs px-2.5 py-1 rounded-full';
  const interactive = onClick ? 'cursor-pointer transition-colors' : '';
  const colors = active
    ? 'bg-amber-400/90 text-gray-900 font-semibold'
    : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300';

  const El = onClick ? 'button' : 'span';

  return (
    <El
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`${base} ${interactive} ${colors}`}
    >
      {GALLERY_TAG_LABELS[tag]}
    </El>
  );
}
