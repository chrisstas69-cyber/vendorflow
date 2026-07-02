import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { getEffectiveDataSource } from '@/lib/pilot-config';
import { prisma } from '@/lib/prisma';
import { resolveVendorEmail } from '@/lib/auth/resolve-vendor-email';

export async function GET(req: NextRequest) {
  await ensurePlatformSeed();
  const vendorEmail = resolveVendorEmail(req);
  // imageData (base64 blobs) is intentionally excluded from the list payload —
  // it multiplied response size ~100x for data the UI never rendered.
  const rows = await prisma.vendorReceipt.findMany({
    where: { vendorEmail },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      category: true,
      amountCents: true,
      fileName: true,
      notes: true,
      createdAt: true,
    },
  });
  const withImage = new Set(
    (
      await prisma.vendorReceipt.findMany({
        where: { vendorEmail, imageData: { not: null } },
        select: { id: true },
        take: 200,
      })
    ).map(r => r.id)
  );
  return NextResponse.json({
    ok: true,
    dataSource: getEffectiveDataSource(),
    items: rows.map(r => ({
      id: r.id,
      category: r.category,
      amount: r.amountCents / 100,
      fileName: r.fileName,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
      hasImage: withImage.has(r.id),
    })),
  });
}

export async function POST(req: NextRequest) {
  await ensurePlatformSeed();
  const vendorEmail = resolveVendorEmail(req);
  const body = await req.json();
  const passport = await prisma.vendorPassport.findUnique({
    where: { vendorEmail },
    select: { id: true },
  });

  const row = await prisma.vendorReceipt.create({
    data: {
      vendorEmail,
      vendorPassportId: passport?.id ?? null,
      category: body.category ?? 'Other',
      amountCents: Math.round((body.amount ?? 0) * 100),
      fileName: body.fileName ?? null,
      imageData: body.imageData ?? null,
      notes: body.notes ?? '',
    },
  });

  return NextResponse.json({
    ok: true,
    receipt: {
      id: row.id,
      category: row.category,
      amount: row.amountCents / 100,
      fileName: row.fileName,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      hasImage: Boolean(row.imageData),
    },
  });
}

export async function DELETE(req: NextRequest) {
  await ensurePlatformSeed();
  const vendorEmail = resolveVendorEmail(req);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 });
  const deleted = await prisma.vendorReceipt
    .deleteMany({ where: { id, vendorEmail } })
    .catch(() => null);
  if (!deleted?.count) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
