'use client';

import { useCallback, useEffect, useState } from 'react';
import type { GalleryEntityType, GalleryItemRecord } from '@/lib/gallery-schema';
import { getCoverImageUrl } from '@/lib/gallery-schema';

export function useGallery(
  entityType: GalleryEntityType,
  entityId: string | null | undefined,
  opts?: { publicOnly?: boolean; enabled?: boolean }
) {
  const publicOnly = opts?.publicOnly ?? false;
  const enabled = opts?.enabled !== false && !!entityId;

  const [items, setItems] = useState<GalleryItemRecord[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/galleries?entityType=${entityType}&entityId=${encodeURIComponent(entityId)}&publicOnly=${publicOnly}`
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? 'Failed to load gallery');
      setItems(json.items ?? []);
      setCoverImageUrl(json.coverImageUrl ?? getCoverImageUrl(json.items ?? []));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load gallery');
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, publicOnly]);

  useEffect(() => {
    if (enabled) refresh();
  }, [enabled, refresh]);

  return { items, coverImageUrl, loading, error, refresh, setItems };
}

export async function uploadGalleryImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose a photo (JPG, PNG, or WebP)');
  if (file.size > 4 * 1024 * 1024) throw new Error('Photo must be under 4 MB');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

export async function createGalleryItemApi(input: {
  entityType: GalleryEntityType;
  entityId: string;
  imageUrl: string;
  caption?: string;
  tags?: string[];
  isCover?: boolean;
  isPublic?: boolean;
}) {
  const res = await fetch('/api/galleries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? 'Upload failed');
  return json.item as GalleryItemRecord;
}

export async function updateGalleryItemApi(
  id: string,
  patch: Partial<Pick<GalleryItemRecord, 'caption' | 'tags' | 'isCover' | 'isPublic'>>
) {
  const res = await fetch(`/api/galleries/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? 'Update failed');
  return json.item as GalleryItemRecord;
}

export async function deleteGalleryItemApi(id: string) {
  const res = await fetch(`/api/galleries/${id}`, { method: 'DELETE' });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? 'Delete failed');
}

export async function reorderGalleryApi(
  entityType: GalleryEntityType,
  entityId: string,
  orderedIds: string[]
) {
  const res = await fetch('/api/galleries/reorder', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entityType, entityId, orderedIds }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? 'Reorder failed');
  return json.items as GalleryItemRecord[];
}
