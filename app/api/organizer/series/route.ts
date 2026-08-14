import { NextRequest } from 'next/server';
import { scaffoldResponse } from '@/lib/api-scaffold';
import { organizerIdForRequest } from '@/lib/auth/guards';

/** GET — list event series for an organizer */
export async function GET(req: NextRequest) {
  const auth = await organizerIdForRequest(req); if (!auth.ok) return auth.response;
  const { searchParams } = new URL(req.url);
  return scaffoldResponse('organizer.series', ['GET'], {
    filters: {
      organizerId: auth.organizerId,
      slug: searchParams.get('slug'),
    },
  });
}

/** POST — create a new event series */
export async function POST(req: NextRequest) {
  const auth = await organizerIdForRequest(req); if (!auth.ok) return auth.response;
  return scaffoldResponse('organizer.series', ['POST'], { status: 201 });
}
