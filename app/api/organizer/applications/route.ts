import { NextRequest, NextResponse } from 'next/server';
import {
  resetPilotDataAsync,
  resolveApplicationActionAsync,
  resolveCreateApplicationAsync,
  resolveOrganizerInboxAsync,
} from '@/lib/pilot-data-adapter';
import type { InboxAction } from '@/lib/organizer-schema';
import type { OrganizerPipelineStage } from '@/lib/organizer-schema';
import { getActiveOrganizerId, getEffectiveDataSource, getPilotDataSource } from '@/lib/pilot-config';
import { ensurePlatformSeed } from '@/lib/platform-seed';

export const dynamic = 'force-dynamic';

/** GET — Applications Pipeline Inbox aggregated for an organizer / event / series */
export async function GET(req: NextRequest) {
  await ensurePlatformSeed();

  const { searchParams } = new URL(req.url);
  const organizerId = searchParams.get('organizerId') ?? undefined;
  const eventId = searchParams.get('eventId') ?? undefined;
  const seriesId = searchParams.get('seriesId') ?? undefined;
  const pipelineStage = searchParams.get('pipelineStage') as OrganizerPipelineStage | null;

  const data = await resolveOrganizerInboxAsync({
    organizerId,
    eventId: eventId ?? undefined,
    seriesId: seriesId ?? undefined,
    pipelineStage: pipelineStage ?? undefined,
  });

  return NextResponse.json({
    ok: true,
    dataSource: getPilotDataSource(),
    effectiveDataSource: getEffectiveDataSource(),
    ...data,
  });
}

/** POST — inbox actions, create application, or reset seed */
export async function POST(req: NextRequest) {
  await ensurePlatformSeed();

  const body = await req.json();
  const { submissionId, action, reset, create } = body as {
    submissionId?: string;
    action?: InboxAction;
    reset?: boolean;
    create?: {
      eventId: string;
      eventName: string;
      vendorEmail: string;
      vendorName: string;
      category: string;
      message?: string;
      requiredForms?: string[];
    };
  };

  if (reset) {
    await resetPilotDataAsync();
    return NextResponse.json({ ok: true, message: 'Pilot data reset to seed' });
  }

  if (create) {
    const item = await resolveCreateApplicationAsync({
      organizerId: getActiveOrganizerId(),
      ...create,
    });
    if (!item) {
      return NextResponse.json(
        { ok: false, error: 'Create requires PILOT_DATA_SOURCE=db' },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, item }, { status: 201 });
  }

  if (!submissionId || !action) {
    return NextResponse.json(
      { ok: false, error: 'submissionId and action are required' },
      { status: 400 }
    );
  }

  const valid: InboxAction[] = ['accept', 'waitlist', 'request_info', 'reject'];
  if (!valid.includes(action)) {
    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  }

  const result = await resolveApplicationActionAsync(submissionId, action);
  if (!result.ok) {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    item: result.item,
    message:
      action === 'accept'
        ? `${result.item.vendorName} approved`
        : action === 'waitlist'
          ? `${result.item.vendorName} waitlisted`
          : action === 'request_info'
            ? `Info requested from ${result.item.vendorName}`
            : `${result.item.vendorName} rejected`,
  });
}
