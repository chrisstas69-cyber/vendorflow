import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { deleteGalleryItem, updateGalleryItem } from '@/lib/gallery-store';
import type { GalleryTag } from '@/lib/gallery-schema';
import { GALLERY_TAGS } from '@/lib/gallery-schema';

export const dynamic = 'force-dynamic';

/** PATCH — update caption, tags, visibility, cover */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await ensurePlatformSeed();

  const body = await req.json();
  const { caption, tags, isCover, isPublic, imageUrl } = body as {
    caption?: string;
    tags?: GalleryTag[];
    isCover?: boolean;
    isPublic?: boolean;
    imageUrl?: string;
  };

  const safeTags =
    tags !== undefined
      ? tags.filter((t): t is GalleryTag => GALLERY_TAGS.includes(t))
      : undefined;

  const item = await updateGalleryItem(params.id, {
    caption,
    tags: safeTags,
    isCover,
    isPublic,
    imageUrl,
  });

  if (!item) {
    return NextResponse.json({ ok: false, error: 'Gallery item not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item });
}

/** DELETE — remove a gallery item */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await ensurePlatformSeed();

  const deleted = await deleteGalleryItem(params.id);
  if (!deleted) {
    return NextResponse.json({ ok: false, error: 'Gallery item not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
