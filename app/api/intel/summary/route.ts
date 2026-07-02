export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { buildVendorIntelSummary } from '@/lib/intel/vendor-intel-summary';
import { resolveVendorEmail } from '@/lib/auth/resolve-vendor-email';

export async function GET(req: NextRequest) {
  await ensurePlatformSeed();
  const vendorEmail = resolveVendorEmail(req);
  const summary = await buildVendorIntelSummary(vendorEmail);
  return NextResponse.json({ ok: true, summary });
}
