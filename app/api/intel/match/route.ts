export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { runIntelPipeline } from '@/lib/intel/pipeline';
import { ruleBasedProvider } from '@/lib/intel/providers/rule-based';
import { mockPlatformEvents } from '@/lib/platform-data';
import { DEMO_VENDOR_EMAIL } from '@/lib/vendor-passport';

/** GET — rule-based vendor ↔ event match score with breakdown */
import { ensurePlatformSeed } from '@/lib/platform-seed';

export async function GET(req: NextRequest) {
  await ensurePlatformSeed();
  const { searchParams } = new URL(req.url);
  const vendorEmail = searchParams.get('vendorEmail') ?? DEMO_VENDOR_EMAIL;
  const eventId = searchParams.get('eventId');
  const useAi = searchParams.get('ai') === '1';

  if (!eventId) {
    return NextResponse.json({ ok: false, error: 'eventId required' }, { status: 400 });
  }

  const event = mockPlatformEvents.find(e => e.id === eventId);
  if (!event) {
    return NextResponse.json({ ok: false, error: 'Event not found' }, { status: 404 });
  }

  if (useAi) {
    const { result, cached, insight } = await runIntelPipeline({
      vendorEmail,
      eventId,
      eventName: event.name,
    });
    return NextResponse.json({ ok: true, cached, insightId: insight.id, match: result });
  }

  const result = await ruleBasedProvider.evaluate({ vendorEmail, eventId, eventName: event.name });
  return NextResponse.json({ ok: true, match: result });
}
