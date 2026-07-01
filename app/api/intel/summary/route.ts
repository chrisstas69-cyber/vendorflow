export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { buildVendorIntelSummary } from '@/lib/intel/vendor-intel-summary';
import { DEMO_VENDOR_EMAIL } from '@/lib/vendor-passport';
import { verifySession, sessionCookieName } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  await ensurePlatformSeed();
  const token = req.cookies.get(sessionCookieName())?.value;
  const session = token ? verifySession(token) : null;
  const { searchParams } = new URL(req.url);
  const vendorEmail = searchParams.get('vendorEmail') ?? session?.email ?? DEMO_VENDOR_EMAIL;
  const summary = await buildVendorIntelSummary(vendorEmail);
  return NextResponse.json({ ok: true, summary });
}
