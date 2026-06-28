import { NextRequest, NextResponse } from 'next/server';
import { getActiveOrganizerId, getEffectiveDataSource } from '@/lib/pilot-config';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { prisma } from '@/lib/prisma';
import { defaultTimelineStages } from '@/lib/workflow/timeline-stages';
import type { EventTimelineStageId } from '@/lib/workflow/timeline-stages';

export const dynamic = 'force-dynamic';

/** GET — operational timeline for an event */
export async function GET(req: NextRequest) {
  await ensurePlatformSeed();

  const { searchParams } = new URL(req.url);
  const organizerId = searchParams.get('organizerId') ?? getActiveOrganizerId();
  const eventId = searchParams.get('eventId');

  if (!eventId) {
    return NextResponse.json({ ok: false, error: 'eventId is required' }, { status: 400 });
  }

  if (getEffectiveDataSource() === 'db') {
    try {
      const row = await prisma.eventTimeline.findUnique({
        where: { organizerId_eventId: { organizerId, eventId } },
      });
      if (row) {
        return NextResponse.json({
          ok: true,
          dataSource: 'db',
          eventId,
          currentStage: row.currentStage,
          stages: JSON.parse(row.stagesJson || '[]'),
        });
      }
    } catch {
      /* fallback */
    }
  }

  const currentStage: EventTimelineStageId =
    eventId === 'evt-001' ? 'booth_assignment' : 'review';

  return NextResponse.json({
    ok: true,
    dataSource: 'seed',
    eventId,
    currentStage,
    stages: defaultTimelineStages(currentStage),
  });
}
