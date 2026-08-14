import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { getEffectiveDataSource } from '@/lib/pilot-config';
import { prisma, isHostedDatabaseUrl } from '@/lib/prisma';
import { requireVendorEmail } from '@/lib/auth/resolve-vendor-email';
import { deletePrivateVendorFile, isSupabaseStorageConfigured, uploadPrivateVendorFile } from '@/lib/storage/supabase-storage';

export async function GET(req: NextRequest) {
  await ensurePlatformSeed();
  const auth = requireVendorEmail(req); if (!auth.ok) return auth.response;
  const vendorEmail = auth.email;
  const dataSource = getEffectiveDataSource();

  if (dataSource !== 'db' || !isHostedDatabaseUrl()) {
    return NextResponse.json({ ok: true, dataSource: 'seed', items: [] });
  }

  try {
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
        fileUrl: true,
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
      dataSource,
      items: rows.map(r => ({
        id: r.id,
        category: r.category,
        amount: r.amountCents / 100,
        fileName: r.fileName,
        notes: r.notes,
        createdAt: r.createdAt.toISOString(),
        hasImage: Boolean(r.fileUrl) || withImage.has(r.id),
      })),
    });
  } catch (err) {
    console.warn('[receipts] DB read failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: true, dataSource: 'seed', items: [] });
  }
}

export async function POST(req: NextRequest) {
  await ensurePlatformSeed();
  if (getEffectiveDataSource() !== 'db' || !isHostedDatabaseUrl()) {
    return NextResponse.json(
      { ok: false, error: 'Receipts require hosted DB mode (PILOT_DATA_SOURCE=db)' },
      { status: 400 }
    );
  }
  const auth = requireVendorEmail(req); if (!auth.ok) return auth.response;
  const vendorEmail = auth.email;
  if (!isSupabaseStorageConfigured()) {
    return NextResponse.json({ ok: false, error: 'Receipt storage is not configured yet' }, { status: 503 });
  }
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File) || file.size <= 0 || file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: 'Choose a receipt file under 8 MB' }, { status: 400 });
  }
  const allowed = file.type.startsWith('image/') || file.type === 'application/pdf';
  if (!allowed) return NextResponse.json({ ok: false, error: 'Use an image or PDF receipt' }, { status: 400 });
  const fileUrl = await uploadPrivateVendorFile(vendorEmail, file);
  const passport = await prisma.vendorPassport.findUnique({
    where: { vendorEmail },
    select: { id: true },
  });

  const row = await prisma.vendorReceipt.create({
    data: {
      vendorEmail,
      vendorPassportId: passport?.id ?? null,
      category: String(form.get('category') ?? 'Other'),
      amountCents: Math.round(Number(form.get('amount') ?? 0) * 100),
      fileName: file.name,
      fileUrl,
      imageData: null,
      notes: String(form.get('notes') ?? file.name),
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
      hasImage: Boolean(row.fileUrl),
    },
  });
}

export async function DELETE(req: NextRequest) {
  await ensurePlatformSeed();
  if (getEffectiveDataSource() !== 'db' || !isHostedDatabaseUrl()) {
    return NextResponse.json(
      { ok: false, error: 'Receipts require hosted DB mode (PILOT_DATA_SOURCE=db)' },
      { status: 400 }
    );
  }
  const auth = requireVendorEmail(req); if (!auth.ok) return auth.response;
  const vendorEmail = auth.email;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 });
  const receipt = await prisma.vendorReceipt.findFirst({ where: { id, vendorEmail }, select: { fileUrl: true } });
  const deleted = await prisma.vendorReceipt.deleteMany({ where: { id, vendorEmail } }).catch(() => null);
  if (!deleted?.count) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
  if (receipt?.fileUrl) await deletePrivateVendorFile(receipt.fileUrl).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
