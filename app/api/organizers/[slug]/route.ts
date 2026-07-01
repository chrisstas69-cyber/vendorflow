import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { getOrganizerPublicProfile } from '@/lib/vendor-applications-store';
import { PILOT_ORGANIZER } from '@/lib/pilot-config';
import { DEMO_ORGANIZER_ID } from '@/lib/platform-data';

export const dynamic = 'force-dynamic';

const SLUG_FALLBACK: Record<string, string> = {
  'hempstead-chamber': DEMO_ORGANIZER_ID,
  'org-demo': DEMO_ORGANIZER_ID,
};

/** GET — public organizer profile + events */
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  await ensurePlatformSeed();
  const profile = await getOrganizerPublicProfile(params.slug);

  if (profile) {
    return NextResponse.json({ ok: true, profile });
  }

  const fallbackId = SLUG_FALLBACK[params.slug];
  if (fallbackId === DEMO_ORGANIZER_ID) {
    const { mockPlatformEvents } = await import('@/lib/platform-data');
    return NextResponse.json({
      ok: true,
      profile: {
        id: DEMO_ORGANIZER_ID,
        slug: params.slug,
        name: PILOT_ORGANIZER.organization,
        email: PILOT_ORGANIZER.email,
        region: PILOT_ORGANIZER.region,
        verified: true,
        planId: PILOT_ORGANIZER.planId,
        tagline: PILOT_ORGANIZER.tagline,
        seasonLabel: PILOT_ORGANIZER.seasonLabel,
        events: mockPlatformEvents.filter(e => e.organizerId === DEMO_ORGANIZER_ID),
      },
    });
  }

  return NextResponse.json({ ok: false, error: 'Organizer not found' }, { status: 404 });
}
