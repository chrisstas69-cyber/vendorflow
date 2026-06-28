import { NextRequest, NextResponse } from 'next/server';
import {
  resolveApplicationByIdAsync,
  resolveCreateApplicationAsync,
} from '@/lib/pilot-data-adapter';
import { getActiveOrganizerId, getPilotDataSource } from '@/lib/pilot-config';
import { ensurePlatformSeed } from '@/lib/platform-seed';

export const dynamic = 'force-dynamic';

/** GET — single application by id */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await ensurePlatformSeed();
  const organizerId = getActiveOrganizerId();
  const item = await resolveApplicationByIdAsync(params.id, organizerId);
  if (!item) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, item });
}

/** PATCH — update application fields (db mode) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await ensurePlatformSeed();

  if (getPilotDataSource() !== 'db') {
    return NextResponse.json(
      { ok: false, error: 'Application updates require PILOT_DATA_SOURCE=db' },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { prisma } = await import('@/lib/prisma');
  const organizerId = getActiveOrganizerId();

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
    },
    include: { boothAssignment: true },
  });

  const item = await resolveApplicationByIdAsync(updated.id, organizerId);
  return NextResponse.json({ ok: true, item });
}
