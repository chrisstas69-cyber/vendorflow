import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { deleteGalleryItem, updateGalleryItem } from '@/lib/gallery-store';
import type { GalleryTag } from '@/lib/gallery-schema';
import { GALLERY_TAGS } from '@/lib/gallery-schema';
import { requireSession } from '@/lib/auth/guards';
import { authorizeGalleryItem } from '@/lib/auth/gallery-authorization';
import { isAllowedImageReference } from '@/lib/storage/image-reference';

export const dynamic = 'force-dynamic';

/** PATCH — update caption, tags, visibility, cover */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireSession(req); if (!auth.ok) return auth.response;
  await ensurePlatformSeed();
  const { id } = await params;
  const ownership = await authorizeGalleryItem(req, id); if (!ownership.ok) return ownership.response;

  const body = await req.json();
  const { caption, tags, isCover, isPublic, imageUrl } = body as {
    caption?: string;
    tags?: GalleryTag[];
    isCover?: boolean;
    isPublic?: boolean;
    imageUrl?: string;
  };
  if (imageUrl !== undefined && !isAllowedImageReference(imageUrl)) {
    return NextResponse.json({ ok: false, error: 'Invalid image URL' }, { status: 400 });
  }

  const safeTags =
    tags !== undefined
      ? tags.filter((t): t is GalleryTag => GALLERY_TAGS.includes(t))
      : undefined;

  const item = await updateGalleryItem(id, {
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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireSession(req); if (!auth.ok) return auth.response;
  await ensurePlatformSeed();
  const { id } = await params;
  const ownership = await authorizeGalleryItem(req, id); if (!ownership.ok) return ownership.response;

  const deleted = await deleteGalleryItem(id);
  if (!deleted) {
    return NextResponse.json({ ok: false, error: 'Gallery item not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
