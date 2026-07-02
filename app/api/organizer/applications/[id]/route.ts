import { NextRequest, NextResponse } from 'next/server';
import {
  resolveApplicationByIdAsync,
  resolveAppendInternalNoteAsync,
} from '@/lib/pilot-data-adapter';
import { getActiveOrganizerId } from '@/lib/pilot-config';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { assertOrganizerOrDemo } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

/** GET — single application by id (organizer inbox; includes internal notes) */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await ensurePlatformSeed();
  const forbidden = assertOrganizerOrDemo(req);
  if (forbidden) return forbidden;
  const organizerId = getActiveOrganizerId();
  const item = await resolveApplicationByIdAsync(params.id, organizerId);
  if (!item) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, item });
}

/** PATCH — update application fields */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await ensurePlatformSeed();
  const forbidden = assertOrganizerOrDemo(req);
  if (forbidden) return forbidden;
  const body = await req.json();
  const organizerId = getActiveOrganizerId();

  if (body.appendInternalNote) {
    const item = await resolveAppendInternalNoteAsync(params.id, String(body.appendInternalNote));
    if (!item) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, item });
  }

  const { getEffectiveDataSource } = await import('@/lib/pilot-config');
  if (getEffectiveDataSource() !== 'db') {
    const { appendInternalNoteSeed } = await import('@/lib/organizer-server-store');
    if (body.shortlisted !== undefined) {
      const { getServerSubmissions, syncServerSubmissions } = await import('@/lib/organizer-server-store');
      const subs = getServerSubmissions();
      const idx = subs.findIndex(s => s.id === params.id);
      if (idx >= 0) {
        subs[idx] = { ...subs[idx], shortlisted: body.shortlisted };
        syncServerSubmissions(subs);
      }
    }
    if (body.appendInternalNote) {
      appendInternalNoteSeed(params.id, body.appendInternalNote);
    }
    const item = await resolveApplicationByIdAsync(params.id, organizerId);
    return NextResponse.json({ ok: true, item });
  }

  const { prisma } = await import('@/lib/prisma');
  const existing = await prisma.vendorApplication.findFirst({
    where: { id: params.id, organizerId },
  });
  if (!existing) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  const updated = await prisma.vendorApplication.update({
    where: { id: params.id },
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
