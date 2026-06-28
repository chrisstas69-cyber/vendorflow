import { prisma } from '@/lib/prisma';
import type { GalleryEntityType, GalleryItemRecord, GalleryTag } from '@/lib/gallery-schema';
import { parseGalleryTags, serializeGalleryTags, toGalleryRecord } from '@/lib/gallery-schema';
import { buildSeedGalleryItems } from '@/lib/gallery-seed-data';

let dbSeeded = false;

export async function ensureGalleryDbSeed() {
  if (dbSeeded) return;
  const count = await prisma.galleryItem.count();
  if (count === 0) {
    const seed = buildSeedGalleryItems();
    for (const item of seed) {
      await prisma.galleryItem.create({
        data: {
          id: item.id,
          entityType: item.entityType,
          entityId: item.entityId,
          imageUrl: item.imageUrl,
          caption: item.caption ?? null,
          tags: serializeGalleryTags(item.tags),
          sortOrder: item.sortOrder,
          isCover: item.isCover,
          isPublic: item.isPublic,
          organizerId: item.entityType === 'organizer' ? item.entityId : undefined,
          passportId:
            item.entityType === 'vendor'
              ? (
                  await prisma.vendorPassport.findUnique({
                    where: { vendorEmail: item.entityId },
                    select: { id: true },
                  })
                )?.id
              : undefined,
        },
      });
    }
  }
  dbSeeded = true;
}

export async function listGalleryDb(
  entityType: GalleryEntityType,
  entityId: string,
  publicOnly = false
): Promise<GalleryItemRecord[]> {
  const rows = await prisma.galleryItem.findMany({
    where: {
      entityType,
      entityId,
      ...(publicOnly ? { isPublic: true } : {}),
    },
    orderBy: { sortOrder: 'asc' },
  });
  return rows.map(toGalleryRecord);
}

export async function createGalleryDb(input: {
  entityType: GalleryEntityType;
  entityId: string;
  imageUrl: string;
  caption?: string;
  tags?: GalleryTag[];
  isCover?: boolean;
  isPublic?: boolean;
}): Promise<GalleryItemRecord> {
  const existing = await prisma.galleryItem.count({
    where: { entityType: input.entityType, entityId: input.entityId },
  });

  if (input.isCover) {
    await prisma.galleryItem.updateMany({
      where: { entityType: input.entityType, entityId: input.entityId },
      data: { isCover: false },
    });
  }

  let organizerId: string | undefined;
  let passportId: string | undefined;
  if (input.entityType === 'organizer') organizerId = input.entityId;
  if (input.entityType === 'vendor') {
    const p = await prisma.vendorPassport.findUnique({
      where: { vendorEmail: input.entityId },
      select: { id: true },
    });
    passportId = p?.id;
  }

  const row = await prisma.galleryItem.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      imageUrl: input.imageUrl,
      caption: input.caption ?? null,
      tags: serializeGalleryTags(input.tags ?? []),
      sortOrder: existing,
      isCover: input.isCover ?? existing === 0,
      isPublic: input.isPublic ?? true,
      organizerId,
      passportId,
    },
  });
  return toGalleryRecord(row);
}

export async function updateGalleryDb(
  id: string,
  patch: Partial<
    Pick<GalleryItemRecord, 'caption' | 'tags' | 'isCover' | 'isPublic' | 'imageUrl'>
  >
): Promise<GalleryItemRecord | null> {
  const current = await prisma.galleryItem.findUnique({ where: { id } });
  if (!current) return null;

  if (patch.isCover) {
    await prisma.galleryItem.updateMany({
      where: { entityType: current.entityType, entityId: current.entityId },
      data: { isCover: false },
    });
  }

  const row = await prisma.galleryItem.update({
    where: { id },
    data: {
      ...(patch.imageUrl !== undefined ? { imageUrl: patch.imageUrl } : {}),
      ...(patch.caption !== undefined ? { caption: patch.caption ?? null } : {}),
      ...(patch.tags !== undefined ? { tags: serializeGalleryTags(patch.tags) } : {}),
      ...(patch.isCover !== undefined ? { isCover: patch.isCover } : {}),
      ...(patch.isPublic !== undefined ? { isPublic: patch.isPublic } : {}),
    },
  });
  return toGalleryRecord(row);
}

export async function deleteGalleryDb(id: string): Promise<boolean> {
  const current = await prisma.galleryItem.findUnique({ where: { id } });
  if (!current) return false;
  await prisma.galleryItem.delete({ where: { id } });
  if (current.isCover) {
    const next = await prisma.galleryItem.findFirst({
      where: { entityType: current.entityType, entityId: current.entityId },
      orderBy: { sortOrder: 'asc' },
    });
    if (next) {
      await prisma.galleryItem.update({ where: { id: next.id }, data: { isCover: true } });
    }
  }
  return true;
}

export async function reorderGalleryDb(
  entityType: GalleryEntityType,
  entityId: string,
  orderedIds: string[]
): Promise<GalleryItemRecord[]> {
  await Promise.all(
    orderedIds.map((id, sortOrder) =>
      prisma.galleryItem.updateMany({
        where: { id, entityType, entityId },
        data: { sortOrder },
      })
    )
  );
  return listGalleryDb(entityType, entityId);
}

export { parseGalleryTags };
