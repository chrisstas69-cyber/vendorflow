import { NextRequest, NextResponse } from 'next/server';
import {
  resolveApplicationByIdAsync,
  resolveAppendInternalNoteAsync,
} from '@/lib/pilot-data-adapter';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { organizerIdForRequest } from '@/lib/auth/guards';
import { isAllowedImageReference } from '@/lib/storage/image-reference';

export const dynamic = 'force-dynamic';

/** GET — single application by id (organizer inbox; includes internal notes) */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensurePlatformSeed();
  const { id } = await params;
  const auth = await organizerIdForRequest(req);
  if (!auth.ok) return auth.response;
  const organizerId = auth.organizerId;
  const item = await resolveApplicationByIdAsync(id, organizerId);
  if (!item) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, item });
}

/** PATCH — update application fields */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensurePlatformSeed();
  const { id } = await params;
  const auth = await organizerIdForRequest(req);
  if (!auth.ok) return auth.response;
  const body = await req.json();
  const organizerId = auth.organizerId;
  if (body.setupPhotoUrl !== undefined && !isAllowedImageReference(body.setupPhotoUrl)) {
    return NextResponse.json({ ok: false, error: 'Invalid photo URL' }, { status: 400 });
  }

  if (body.appendInternalNote) {
    const item = await resolveAppendInternalNoteAsync(
      id,
      String(body.appendInternalNote),
      organizerId
    );
    if (!item) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, item });
  }

  const { getEffectiveDataSource } = await import('@/lib/pilot-config');
  if (getEffectiveDataSource() !== 'db') {
    const { appendInternalNoteSeed } = await import('@/lib/organizer-server-store');
    if (body.shortlisted !== undefined) {
      const { getServerSubmissions, syncServerSubmissions } = await import('@/lib/organizer-server-store');
      const subs = getServerSubmissions();
      const idx = subs.findIndex(s => s.id === id);
      if (idx >= 0) {
        subs[idx] = { ...subs[idx], shortlisted: body.shortlisted };
        syncServerSubmissions(subs);
      }
    }
    if (body.appendInternalNote) {
      appendInternalNoteSeed(id, body.appendInternalNote);
    }
    const item = await resolveApplicationByIdAsync(id, organizerId);
    return NextResponse.json({ ok: true, item });
  }

  const { prisma } = await import('@/lib/prisma');
  const existing = await prisma.vendorApplication.findFirst({
    where: { id, organizerId },
  });
  if (!existing) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  const updated = await prisma.vendorApplication.update({
    where: { id },
    data: {
      ...(body.shortlisted !== undefined ? { shortlisted: body.shortlisted } : {}),
      ...(body.message !== undefined ? { message: body.message } : {}),
      ...(body.setupPhotoUrl !== undefined ? { setupPhotoUrl: body.setupPhotoUrl } : {}),
      ...(body.uploadedDocTypes !== undefined
        ? { uploadedDocTypes: JSON.stringify(body.uploadedDocTypes) }
        : {}),
      ...(body.internalNotes !== undefined ? { internalNotes: body.internalNotes } : {}),
    },
    include: { boothAssignment: true },
  });

  const item = await resolveApplicationByIdAsync(updated.id, organizerId);
  return NextResponse.json({ ok: true, item });
}
