import { scaffoldResponse } from '@/lib/api-scaffold';

interface RouteParams {
  params: { seriesId: string };
}

/** GET — series detail with linked event ids */
export async function GET(_req: Request, { params }: RouteParams) {
  return scaffoldResponse('organizer.series.detail', ['GET'], {
    seriesId: params.seriesId,
  });
}

/** PATCH — update series metadata or event membership */
export async function PATCH(_req: Request, { params }: RouteParams) {
  return scaffoldResponse('organizer.series.detail', ['PATCH'], {
    seriesId: params.seriesId,
  });
}
