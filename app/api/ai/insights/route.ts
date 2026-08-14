import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { requireAdmin, requireSession } from '@/lib/auth/guards';

/** GET — list cached AI insights */
export async function GET(req: NextRequest) {
  const auth = requireSession(req); if (!auth.ok) return auth.response;
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
  const auth = requireAdmin(req); if (!auth.ok) return auth.response;
  await ensurePlatformSeed();
  const body = await req.json();
  const insight = await prisma.aIInsight.create({ data: body });
  return NextResponse.json({ ok: true, insight }, { status: 201 });
}
