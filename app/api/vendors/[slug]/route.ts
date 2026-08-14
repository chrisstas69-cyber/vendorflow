import { NextRequest, NextResponse } from 'next/server';
import { getPublicVendorProfile } from '@/lib/vendor-passport';

export const dynamic = 'force-dynamic';

/** GET — public vendor profile (no private contact / documents) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const profile = getPublicVendorProfile(slug);
  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Vendor not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, profile });
}
