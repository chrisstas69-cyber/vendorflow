import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { reorderGalleryItems } from '@/lib/gallery-store';
import type { GalleryEntityType } from '@/lib/gallery-schema';

export const dynamic = 'force-dynamic';

/** PUT — reorder gallery items by id list */
export async function PUT(req: NextRequest) {
  await ensurePlatformSeed();

  const body = await req.json();
  const { entityType, entityId, orderedIds } = body as {
    entityType?: GalleryEntityType;
    entityId?: string;
    orderedIds?: string[];
  };

  if (!entityType || !entityId || !Array.isArray(orderedIds)) {
    return NextResponse.json(
      { ok: false, error: 'entityType, entityId, and orderedIds[] are required' },
      { status: 400 }
    );
  }

  const items = await reorderGalleryItems(entityType, entityId, orderedIds);
  return NextResponse.json({ ok: true, items });
}
