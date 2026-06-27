import { NextRequest, NextResponse } from 'next/server';
import {
  getApplicationsInbox,
  performInboxAction,
  resetOrganizerServerStore,
} from '@/lib/organizer-server-store';
import type { InboxAction } from '@/lib/organizer-schema';
import type { OrganizerPipelineStage } from '@/lib/organizer-schema';

/** GET — Applications Pipeline Inbox aggregated for an organizer / event / series */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const organizerId = searchParams.get('organizerId') ?? undefined;
  const eventId = searchParams.get('eventId') ?? undefined;
  const seriesId = searchParams.get('seriesId') ?? undefined;
  const pipelineStage = searchParams.get('pipelineStage') as OrganizerPipelineStage | null;

  const data = getApplicationsInbox({
    organizerId,
    eventId: eventId ?? undefined,
    seriesId: seriesId ?? undefined,
    pipelineStage: pipelineStage ?? undefined,
  });

  return NextResponse.json({
    ok: true,
    ...data,
  });
}

/** POST — inbox actions: accept | waitlist | request_info | reject */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { submissionId, action, reset } = body as {
    submissionId?: string;
    action?: InboxAction;
    reset?: boolean;
  };

  if (reset) {
    resetOrganizerServerStore();
    return NextResponse.json({ ok: true, message: 'Inbox reset to seed data' });
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

  const result = performInboxAction(submissionId, action);
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
