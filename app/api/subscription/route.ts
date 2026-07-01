import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import {
  getSubscriptionSummary,
  setOrganizerPlan,
  setVendorPlan,
} from '@/lib/subscription-store';
import { getActiveOrganizerId } from '@/lib/pilot-config';
import { DEMO_VENDOR_EMAIL } from '@/lib/vendor-passport';

export async function GET(req: NextRequest) {
  await ensurePlatformSeed();
  const { searchParams } = new URL(req.url);
  const vendorEmail = searchParams.get('vendorEmail') ?? DEMO_VENDOR_EMAIL;
  const summary = await getSubscriptionSummary(vendorEmail);
  return NextResponse.json({ ok: true, ...summary });
}

/** POST { role, planId, email? } — skeleton plan selection (billing via Stripe when keys added) */
export async function POST(req: NextRequest) {
  await ensurePlatformSeed();
  const body = await req.json();
  const { role, planId } = body as { role: 'vendor' | 'organizer'; planId: string };
  if (!planId) {
    return NextResponse.json({ ok: false, error: 'planId required' }, { status: 400 });
  }
  if (role === 'vendor') {
    await setVendorPlan(body.email ?? DEMO_VENDOR_EMAIL, planId);
  } else {
    await setOrganizerPlan(getActiveOrganizerId(), planId);
  }
  return NextResponse.json({
    ok: true,
    message: 'Plan saved. Connect Stripe keys to enable billing.',
  });
}
