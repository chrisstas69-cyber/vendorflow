import { NextRequest } from 'next/server';
import { scaffoldResponse } from '@/lib/api-scaffold';

/** GET — list payment accounts (vendor / organizer / platform) */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  return scaffoldResponse('payments.accounts', ['GET'], {
    filters: {
      ownerType: searchParams.get('ownerType'),
      ownerId: searchParams.get('ownerId'),
    },
  });
}

/** POST — create or register a payout account */
export async function POST() {
  return scaffoldResponse('payments.accounts', ['POST'], { status: 201 });
}
