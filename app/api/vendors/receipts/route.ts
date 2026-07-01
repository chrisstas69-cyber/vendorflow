import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { getEffectiveDataSource } from '@/lib/pilot-config';
import { prisma } from '@/lib/prisma';
import { DEMO_VENDOR_EMAIL } from '@/lib/vendor-passport';
import { verifySession, sessionCookieName } from '@/lib/auth/session';

function resolveEmail(req: NextRequest) {
  const token = req.cookies.get(sessionCookieName())?.value;
  const session = token ? verifySession(token) : null;
  if (session?.role === 'vendor') return session.email;
  return DEMO_VENDOR_EMAIL;
}

export async function GET(req: NextRequest) {
  await ensurePlatformSeed();
  const vendorEmail = resolveEmail(req);
  const rows = await prisma.vendorReceipt.findMany({
    where: { vendorEmail },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      category: true,
      amountCents: true,
      fileName: true,
      notes: true,
      createdAt: true,
      imageData: true,
    },
  });
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
      hasImage: Boolean(r.imageData),
      imageData: r.imageData,
    })),
  });
}

export async function POST(req: NextRequest) {
  await ensurePlatformSeed();
  const vendorEmail = resolveEmail(req);
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
      imageData: row.imageData,
    },
  });
}

export async function DELETE(req: NextRequest) {
  await ensurePlatformSeed();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 });
  await prisma.vendorReceipt.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
