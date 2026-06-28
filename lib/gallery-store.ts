import { getPilotDataSource } from '@/lib/pilot-config';
import type { GalleryEntityType, GalleryItemRecord, GalleryTag } from '@/lib/gallery-schema';
import { getCoverImageUrl } from '@/lib/gallery-schema';
import {
  createGallerySeed,
  deleteGallerySeed,
  listGallerySeed,
  reorderGallerySeed,
  updateGallerySeed,
} from '@/lib/gallery-seed-store';
import {
  createGalleryDb,
  deleteGalleryDb,
  ensureGalleryDbSeed,
  listGalleryDb,
  reorderGalleryDb,
  updateGalleryDb,
} from '@/lib/gallery-db-store';

export async function listGallery(
  entityType: GalleryEntityType,
  entityId: string,
  publicOnly = false
): Promise<{ items: GalleryItemRecord[]; dataSource: 'seed' | 'db' }> {
  if (getPilotDataSource() === 'db') {
    await ensureGalleryDbSeed();
    const items = await listGalleryDb(entityType, entityId, publicOnly);
    return { items, dataSource: 'db' };
  }
  return { items: listGallerySeed(entityType, entityId, publicOnly), dataSource: 'seed' };
}

export async function createGalleryItem(input: {
  entityType: GalleryEntityType;
  entityId: string;
  imageUrl: string;
  caption?: string;
  tags?: GalleryTag[];
  isCover?: boolean;
  isPublic?: boolean;
}) {
  if (getPilotDataSource() === 'db') {
    await ensureGalleryDbSeed();
    return createGalleryDb(input);
  }
  return createGallerySeed(input);
}

export async function updateGalleryItem(
  id: string,
  patch: Partial<
    Pick<GalleryItemRecord, 'caption' | 'tags' | 'isCover' | 'isPublic' | 'imageUrl'>
  >
) {
  if (getPilotDataSource() === 'db') {
    return updateGalleryDb(id, patch);
  }
  return updateGallerySeed(id, patch);
}

export async function deleteGalleryItem(id: string) {
  if (getPilotDataSource() === 'db') {
    return deleteGalleryDb(id);
  }
  return deleteGallerySeed(id);
}

export async function reorderGalleryItems(
  entityType: GalleryEntityType,
  entityId: string,
  orderedIds: string[]
) {
  if (getPilotDataSource() === 'db') {
    return reorderGalleryDb(entityType, entityId, orderedIds);
  }
  return reorderGallerySeed(entityType, entityId, orderedIds);
}

export async function getGalleryCoverUrl(
  entityType: GalleryEntityType,
  entityId: string,
  publicOnly = true
) {
  const { items } = await listGallery(entityType, entityId, publicOnly);
  return getCoverImageUrl(items);
}
