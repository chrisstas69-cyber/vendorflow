import { NextRequest, NextResponse } from 'next/server';
import { refreshEventInsights } from '@/lib/intel/pipeline';
import { requireAdmin, requireCronSecret } from '@/lib/auth/guards';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** POST — on-demand refresh: cache AI recommendations for event + vendor matches */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = requireAdmin(req); if (!auth.ok) return auth.response;
  const { id } = await params;
  try {
    const data = await refreshEventInsights(id);
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Refresh failed' },
      { status: 500 }
    );
  }
}

/** GET — trigger refresh via cron or manual poll */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const denied = requireCronSecret(req); if (denied) return denied;
  const { id } = await params;

  try {
    const data = await refreshEventInsights(id);
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Refresh failed' },
      { status: 500 }
    );
  }
}
