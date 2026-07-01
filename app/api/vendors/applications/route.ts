import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { resolveVendorEmail } from '@/lib/auth/resolve-vendor-email';
import { getEffectiveDataSource } from '@/lib/pilot-config';
import { listVendorApplicationsFromDb } from '@/lib/vendor-applications-store';

export const dynamic = 'force-dynamic';

/** GET — vendor's own applications from Postgres */
export async function GET(req: NextRequest) {
  await ensurePlatformSeed();
  const vendorEmail = resolveVendorEmail(req);
  const applications = await listVendorApplicationsFromDb(vendorEmail);
  return NextResponse.json({
    ok: true,
    dataSource: getEffectiveDataSource(),
    applications,
    vendorEmail,
  });
}
