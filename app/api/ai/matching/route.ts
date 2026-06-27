import { NextRequest } from 'next/server';
import { scaffoldResponse } from '@/lib/api-scaffold';

/** GET — vendor ↔ event match recommendations (reads AIInsight cache) */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  return scaffoldResponse('ai.matching', ['GET'], {
    filters: {
      vendorPassportId: searchParams.get('vendorPassportId'),
      vendorEmail: searchParams.get('vendorEmail'),
      eventId: searchParams.get('eventId'),
      limit: searchParams.get('limit') ?? '10',
    },
  });
}
