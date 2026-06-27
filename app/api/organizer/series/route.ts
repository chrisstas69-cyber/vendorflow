import { NextRequest } from 'next/server';
import { scaffoldResponse } from '@/lib/api-scaffold';

/** GET — list event series for an organizer */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  return scaffoldResponse('organizer.series', ['GET'], {
    filters: {
      organizerId: searchParams.get('organizerId'),
      slug: searchParams.get('slug'),
    },
  });
}

/** POST — create a new event series */
export async function POST() {
  return scaffoldResponse('organizer.series', ['POST'], { status: 201 });
}
