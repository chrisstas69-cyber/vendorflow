import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensurePlatformSeed } from '@/lib/platform-seed';

/** GET — list cached AI insights */
export async function GET(req: NextRequest) {
  await ensurePlatformSeed();
  const { searchParams } = new URL(req.url);
  const insights = await prisma.aIInsight.findMany({
    where: {
      scopeType: searchParams.get('scopeType') ?? undefined,
      scopeId: searchParams.get('scopeId') ?? undefined,
      insightType: searchParams.get('insightType') ?? undefined,
      status: searchParams.get('status') ?? 'active',
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({ ok: true, insights });
}

/** POST — store insight row */
export async function POST(req: NextRequest) {
  await ensurePlatformSeed();
  const body = await req.json();
  const insight = await prisma.aIInsight.create({ data: body });
  return NextResponse.json({ ok: true, insight }, { status: 201 });
}
