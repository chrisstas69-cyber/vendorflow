import { NextRequest, NextResponse } from 'next/server';
import { refreshEventInsights } from '@/lib/intel/pipeline';

interface RouteParams {
  params: { id: string };
}

/** POST — on-demand refresh: cache AI recommendations for event + vendor matches */
export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const data = await refreshEventInsights(params.id);
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
  const secret = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await refreshEventInsights(params.id);
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Refresh failed' },
      { status: 500 }
    );
  }
}
