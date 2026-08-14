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
import { sendCe200FromDb } from '@/lib/vendor-applications-store';
import { getSessionFromRequest, organizerIdForRequest, rateLimit } from '@/lib/auth/guards';
import { isAllowedImageReference } from '@/lib/storage/image-reference';

async function organizerForEvent(eventId: string) {
  const { mockPlatformEvents } = await import('@/lib/platform-data');
  const platformEvent = mockPlatformEvents.find(event => event.id === eventId);
  if (platformEvent?.organizerId) return platformEvent.organizerId;
  try {
    const { prisma } = await import('@/lib/prisma');
    const listing = await prisma.publicEventListing.findFirst({
      where: { OR: [{ id: eventId }, { slug: eventId }] },
      select: { claimedByEmail: true, organizerEmail: true },
    });
    const email = listing?.claimedByEmail ?? listing?.organizerEmail;
    if (email) {
      const organizer = await prisma.organizerAccount.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true },
      });
      if (organizer) return organizer.id;
    }
  } catch {
    // The public submission remains available when the hosted DB is temporarily unavailable.
  }
  return getActiveOrganizerId();
}

export const dynamic = 'force-dynamic';

/** GET — Applications Pipeline Inbox aggregated for an organizer / event / series */
export async function GET(req: NextRequest) {
  await ensurePlatformSeed();

  const auth = await organizerIdForRequest(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('eventId') ?? undefined;
  const seriesId = searchParams.get('seriesId') ?? undefined;
  const pipelineStage = searchParams.get('pipelineStage') as OrganizerPipelineStage | null;

  const data = await resolveOrganizerInboxAsync({
    organizerId: auth.organizerId,
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
    action?: InboxAction | 'send_ce200';
    reset?: boolean;
    create?: {
      eventId: string;
      eventName: string;
      vendorEmail: string;
      vendorName: string;
      category: string;
      message?: string;
      requiredForms?: string[];
      hasInsurance?: boolean;
      setupPhotoUrl?: string;
    };
  };

  if (reset) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ ok: false, error: 'Reset disabled in production' }, { status: 403 });
    }
    await resetPilotDataAsync();
    return NextResponse.json({ ok: true, message: 'Pilot data reset to seed' });
  }

  if (create) {
    // Signed-in vendors always apply as themselves; public applicants supply their own email.
    const session = getSessionFromRequest(req);
    if (session?.role === 'vendor') {
      create.vendorEmail = session.email;
    }
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(create.vendorEmail);
    if (
      !emailValid ||
      !create.eventId?.trim() ||
      !create.eventName?.trim() || create.eventName.length > 160 ||
      !create.vendorName?.trim() || create.vendorName.length > 120 ||
      !create.category?.trim() || create.category.length > 80 ||
      (create.message?.length ?? 0) > 2000
    ) {
      return NextResponse.json({ ok: false, error: 'Invalid application details' }, { status: 400 });
    }
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (!rateLimit(`application:${ip}`, 20, 60 * 60_000) || !rateLimit(`application:${create.vendorEmail}`, 10, 60 * 60_000)) {
      return NextResponse.json({ ok: false, error: 'Too many applications. Try again later.' }, { status: 429 });
    }
    if (create.setupPhotoUrl && !isAllowedImageReference(create.setupPhotoUrl)) {
      return NextResponse.json(
        { ok: false, error: 'Upload the setup photo before submitting the application' },
        { status: 400 }
      );
    }
    const targetOrganizerId = await organizerForEvent(create.eventId);
    const item = await resolveCreateApplicationAsync({
      organizerId: targetOrganizerId,
      ...create,
    });
    if (!item) {
      return NextResponse.json(
        { ok: false, error: 'Could not create application' },
        { status: 400 }
      );
    }

    try {
      const { queueEmail } = await import('@/lib/email-queue');
      const { PILOT_ORGANIZER } = await import('@/lib/pilot-config');
      await queueEmail({
        templateId: 'application_received',
        toEmail: create.vendorEmail,
        applicationId: item.id,
        organizerId: targetOrganizerId,
        vars: {
          vendorName: create.vendorName,
          eventName: create.eventName,
          organizerName: PILOT_ORGANIZER.organization,
        },
      });
    } catch {
      /* queue optional */
    }

    return NextResponse.json({ ok: true, item }, { status: 201 });
  }

  // Everything below is an organizer inbox action — vendors can't approve themselves.
  const auth = await organizerIdForRequest(req);
  if (!auth.ok) return auth.response;

  if (action === 'send_ce200' && submissionId) {
    const result = await sendCe200FromDb(submissionId);
    if (!result.ok) {
      return NextResponse.json(result, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      application: result.application,
      message: 'CE200 queued — email sends when RESEND_API_KEY is set',
    });
  }

  if (!submissionId || !action) {
    return NextResponse.json(
      { ok: false, error: 'submissionId and action are required' },
      { status: 400 }
    );
  }

  const valid: InboxAction[] = ['accept', 'waitlist', 'request_info', 'reject'];
  if (!valid.includes(action as InboxAction)) {
    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  }

  const result = await resolveApplicationActionAsync(
    submissionId,
    action as InboxAction,
    auth.organizerId
  );
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
