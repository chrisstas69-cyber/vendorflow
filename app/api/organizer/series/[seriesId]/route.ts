import { scaffoldResponse } from '@/lib/api-scaffold';
import { organizerIdForRequest } from '@/lib/auth/guards';
import type { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{ seriesId: string }>;
}

/** GET — series detail with linked event ids */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await organizerIdForRequest(req); if (!auth.ok) return auth.response;
  const { seriesId } = await params;
  return scaffoldResponse('organizer.series.detail', ['GET'], {
    seriesId,
  });
}

/** PATCH — update series metadata or event membership */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await organizerIdForRequest(req); if (!auth.ok) return auth.response;
  const { seriesId } = await params;
  return scaffoldResponse('organizer.series.detail', ['PATCH'], {
    seriesId,
  });
}
