import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import {
  getSubscriptionSummary,
  setOrganizerPlan,
  setVendorPlan,
} from '@/lib/subscription-store';
import { organizerIdForRequest, requireRole, requireSession } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  await ensurePlatformSeed();
  const auth = requireSession(req); if (!auth.ok) return auth.response;
  if (auth.session.role === 'vendor') {
    const summary = await getSubscriptionSummary(auth.session.email);
    return NextResponse.json({ ok: true, summary });
  }
  const organizer = await organizerIdForRequest(req);
  if (!organizer.ok) return organizer.response;
  const { getOrganizerPlanId } = await import('@/lib/subscription-store');
  return NextResponse.json({
    ok: true,
    summary: { role: 'organizer', planId: await getOrganizerPlanId(organizer.organizerId) },
  });
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
    const auth = requireRole(req, 'vendor'); if (!auth.ok) return auth.response;
    await setVendorPlan(auth.session.email, planId);
  } else {
    const auth = await organizerIdForRequest(req); if (!auth.ok) return auth.response;
    await setOrganizerPlan(auth.organizerId, planId);
  }
  return NextResponse.json({
    ok: true,
    message: 'Plan saved. Connect Stripe keys to enable billing.',
  });
}
