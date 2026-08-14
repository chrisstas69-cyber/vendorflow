import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { getEffectiveDataSource } from '@/lib/pilot-config';
import type { EventDebriefInput } from '@/lib/event-debrief-schema';
import { listDebriefs, upsertDebrief } from '@/lib/event-debrief-store';
import { requireVendorEmail } from '@/lib/auth/resolve-vendor-email';
import { DEMO_VENDOR_EMAIL } from '@/lib/vendor-passport';

/** GET — list vendor event logbook entries */
export async function GET(req: NextRequest) {
  await ensurePlatformSeed();
  const auth = requireVendorEmail(req); if (!auth.ok) return auth.response;
  const vendorEmail = auth.email;
  const { items } = await listDebriefs(vendorEmail);
  return NextResponse.json({
    ok: true,
    dataSource: getEffectiveDataSource(),
    items,
  });
}

/** POST — create or upsert debrief */
export async function POST(req: NextRequest) {
  await ensurePlatformSeed();
  const body = await req.json();
  const auth = requireVendorEmail(req); if (!auth.ok) return auth.response;
  const vendorEmail = auth.email;
  const input = body.debrief as EventDebriefInput;
  if (!input?.eventName || !input?.eventDate) {
    return NextResponse.json({ ok: false, error: 'eventName and eventDate required' }, { status: 400 });
  }
  const saved = await upsertDebrief(vendorEmail, input);
  return NextResponse.json({ ok: true, debrief: saved, dataSource: getEffectiveDataSource() });
}
