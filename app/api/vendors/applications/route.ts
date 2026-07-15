import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { resolveVendorEmail } from '@/lib/auth/resolve-vendor-email';
import { getEffectiveDataSource } from '@/lib/pilot-config';
import { listVendorApplicationsFromDb } from '@/lib/vendor-applications-store';
import { mockApplications } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

/** GET — vendor's own applications (Postgres when available, seed demo otherwise) */
export async function GET(req: NextRequest) {
  await ensurePlatformSeed();
  const vendorEmail = resolveVendorEmail(req);
  const dataSource = getEffectiveDataSource();

  if (dataSource !== 'db') {
    return NextResponse.json({
      ok: true,
      dataSource,
      applications: mockApplications,
      vendorEmail,
    });
  }

  try {
    const applications = await listVendorApplicationsFromDb(vendorEmail);
    return NextResponse.json({
      ok: true,
      dataSource,
      applications,
      vendorEmail,
    });
  } catch (err) {
    console.warn(
      '[vendors/applications] DB read failed, falling back to seed:',
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({
      ok: true,
      dataSource: 'seed',
      applications: mockApplications,
      vendorEmail,
    });
  }
}
