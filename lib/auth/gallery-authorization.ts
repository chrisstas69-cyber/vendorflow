import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { GalleryEntityType } from '@/lib/gallery-schema';
import { getSessionFromRequest } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

type GalleryAuthResult = { ok: true } | { ok: false; response: NextResponse };

function denied(status = 403): GalleryAuthResult {
  return {
    ok: false,
    response: NextResponse.json(
      { ok: false, error: status === 401 ? 'Sign-in required' : 'Gallery access denied' },
      { status }
    ),
  };
}

export async function authorizeGalleryEntity(
  req: NextRequest,
  entityType: GalleryEntityType,
  entityId: string
): Promise<GalleryAuthResult> {
  const session = getSessionFromRequest(req);
  if (!session) return denied(401);
  const admins = (process.env.ADMIN_EMAILS ?? '').split(',').map(value => value.trim().toLowerCase());
  if (admins.includes(session.email)) return { ok: true };

  if (session.role === 'vendor') {
    if (entityType !== 'vendor') return denied();
    const passport = await prisma.vendorPassport.findUnique({
      where: { vendorEmail: session.email },
      select: { id: true },
    });
    return entityId === session.email || entityId === passport?.id ? { ok: true } : denied();
  }

  const organizer = await prisma.organizerAccount.findUnique({
    where: { email: session.email },
    select: { id: true },
  });
  if (!organizer) return denied();
  if (entityType === 'organizer') return entityId === organizer.id ? { ok: true } : denied();
  if (entityType !== 'event') return denied();

  const { mockPlatformEvents } = await import('@/lib/platform-data');
  if (mockPlatformEvents.some(event => event.id === entityId && event.organizerId === organizer.id)) {
    return { ok: true };
  }
  const listing = await prisma.publicEventListing.findFirst({
    where: {
      AND: [
        { OR: [{ id: entityId }, { slug: entityId }] },
        { OR: [{ claimedByEmail: session.email }, { organizerEmail: session.email }] },
      ],
    },
    select: { id: true },
  });
  return listing ? { ok: true } : denied();
}

export async function authorizeGalleryItem(req: NextRequest, id: string): Promise<GalleryAuthResult> {
  const item = await prisma.galleryItem.findUnique({
    where: { id },
    select: { entityType: true, entityId: true },
  });
  if (!item) return denied();
  return authorizeGalleryEntity(req, item.entityType as GalleryEntityType, item.entityId);
}
