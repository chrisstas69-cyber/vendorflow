import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { createGalleryItem, listGallery } from '@/lib/gallery-store';
import type { GalleryEntityType, GalleryTag } from '@/lib/gallery-schema';
import { GALLERY_TAGS, getCoverImageUrl } from '@/lib/gallery-schema';

export const dynamic = 'force-dynamic';

/** GET — list gallery items for an entity */
export async function GET(req: NextRequest) {
  try {
    await ensurePlatformSeed();

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType') as GalleryEntityType | null;
    const entityId = searchParams.get('entityId');
    const publicOnly = searchParams.get('publicOnly') === 'true';

    if (!entityType || !entityId) {
      return NextResponse.json(
        { ok: false, error: 'entityType and entityId are required' },
        { status: 400 }
      );
    }

    if (!['event', 'organizer', 'vendor'].includes(entityType)) {
      return NextResponse.json({ ok: false, error: 'Invalid entityType' }, { status: 400 });
    }

    const { items, dataSource } = await listGallery(entityType, entityId, publicOnly);

    return NextResponse.json({
      ok: true,
      entityType,
      entityId,
      items,
      coverImageUrl: getCoverImageUrl(items),
      dataSource,
    });
  } catch (err) {
    console.error('[galleries GET]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Failed to load gallery' },
      { status: 500 }
    );
  }
}

/** POST — add a gallery item */
export async function POST(req: NextRequest) {
  await ensurePlatformSeed();

  const body = await req.json();
  const {
    entityType,
    entityId,
    imageUrl,
    caption,
    tags,
    isCover,
    isPublic,
  } = body as {
    entityType?: GalleryEntityType;
    entityId?: string;
    imageUrl?: string;
    caption?: string;
    tags?: GalleryTag[];
    isCover?: boolean;
    isPublic?: boolean;
  };

  if (!entityType || !entityId || !imageUrl) {
    return NextResponse.json(
      { ok: false, error: 'entityType, entityId, and imageUrl are required' },
      { status: 400 }
    );
  }

  const safeTags = (tags ?? []).filter((t): t is GalleryTag => GALLERY_TAGS.includes(t));

  const item = await createGalleryItem({
    entityType,
    entityId,
    imageUrl,
    caption,
    tags: safeTags,
    isCover,
    isPublic,
  });

  return NextResponse.json({ ok: true, item });
}
