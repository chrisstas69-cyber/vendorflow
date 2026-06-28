import type { GalleryEntityType, GalleryItemRecord, GalleryTag } from '@/lib/gallery-schema';
import { buildSeedGalleryItems, serializeGalleryTags } from '@/lib/gallery-seed-data';

let items: GalleryItemRecord[] = [];

export function ensureGallerySeedStore() {
  if (items.length === 0) {
    items = buildSeedGalleryItems();
  }
}

export function listGallerySeed(
  entityType: GalleryEntityType,
  entityId: string,
  publicOnly = false
): GalleryItemRecord[] {
  ensureGallerySeedStore();
  return items
    .filter(i => i.entityType === entityType && i.entityId === entityId)
    .filter(i => !publicOnly || i.isPublic)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function createGallerySeed(input: {
  entityType: GalleryEntityType;
  entityId: string;
  imageUrl: string;
  caption?: string;
  tags?: GalleryTag[];
  isCover?: boolean;
  isPublic?: boolean;
}): GalleryItemRecord {
  ensureGallerySeedStore();
  const existing = items.filter(
    i => i.entityType === input.entityType && i.entityId === input.entityId
  );
  const now = new Date().toISOString();
  const id = `gal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const record: GalleryItemRecord = {
    id,
    entityType: input.entityType,
    entityId: input.entityId,
    imageUrl: input.imageUrl,
    caption: input.caption,
    tags: input.tags ?? [],
    sortOrder: existing.length,
    isCover: input.isCover ?? existing.length === 0,
    isPublic: input.isPublic ?? true,
    createdAt: now,
    updatedAt: now,
  };
  if (record.isCover) {
    items = items.map(i =>
      i.entityType === input.entityType && i.entityId === input.entityId
        ? { ...i, isCover: false }
        : i
    );
  }
  items.push(record);
  return record;
}

export function updateGallerySeed(
  id: string,
  patch: Partial<
    Pick<GalleryItemRecord, 'caption' | 'tags' | 'isCover' | 'isPublic' | 'imageUrl'>
  >
): GalleryItemRecord | null {
  ensureGallerySeedStore();
  const idx = items.findIndex(i => i.id === id);
  if (idx < 0) return null;
  const current = items[idx];
  if (patch.isCover) {
    items = items.map(i =>
      i.entityType === current.entityType && i.entityId === current.entityId
        ? { ...i, isCover: i.id === id }
        : i
    );
  }
  const updated = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  items[idx] = updated;
  return updated;
}

export function deleteGallerySeed(id: string): boolean {
  ensureGallerySeedStore();
  const target = items.find(i => i.id === id);
  if (!target) return false;
  items = items.filter(i => i.id !== id);
  const siblings = items
    .filter(i => i.entityType === target.entityType && i.entityId === target.entityId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (target.isCover && siblings[0]) {
    siblings[0].isCover = true;
  }
  siblings.forEach((s, i) => {
    s.sortOrder = i;
  });
  return true;
}

export function reorderGallerySeed(
  entityType: GalleryEntityType,
  entityId: string,
  orderedIds: string[]
): GalleryItemRecord[] {
  ensureGallerySeedStore();
  orderedIds.forEach((id, sortOrder) => {
    const idx = items.findIndex(i => i.id === id);
    if (idx >= 0 && items[idx].entityType === entityType && items[idx].entityId === entityId) {
      items[idx] = { ...items[idx], sortOrder, updatedAt: new Date().toISOString() };
    }
  });
  return listGallerySeed(entityType, entityId);
}

export { serializeGalleryTags };
