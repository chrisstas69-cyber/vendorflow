import { prisma } from '@/lib/prisma';
import { PILOT_ORGANIZER } from '@/lib/pilot-config';
import {
  DEMO_ORGANIZER_ID,
  mockEventSeries,
  mockVendorSubmissions,
} from '@/lib/platform-data';
import { defaultTimelineStages } from '@/lib/workflow/timeline-stages';
import { WorkflowEventType } from '@/lib/workflow/event-types';
import { emitActivity } from '@/lib/workflow/emit-activity';

const DEFAULT_BOOTH_GRID = [
  { id: 'A-1', label: 'A-1', utilities: ['electric'] },
  { id: 'A-2', label: 'A-2', utilities: [] },
  { id: 'A-3', label: 'A-3', utilities: ['electric', 'water'] },
  { id: 'B-1', label: 'B-1', utilities: ['electric'] },
  { id: 'B-2', label: 'B-2', utilities: [] },
  { id: 'B-3', label: 'B-3', utilities: [] },
  { id: 'C-1', label: 'C-1', utilities: ['water'] },
  { id: 'C-2', label: 'C-2', utilities: [] },
  { id: 'C-3', label: 'C-3', utilities: ['electric'] },
];

let pilotDbSeeded = false;

export async function ensurePilotDbSeed() {
  if (pilotDbSeeded) return;

  const existing = await prisma.organizerAccount.findUnique({
    where: { id: DEMO_ORGANIZER_ID },
  });
  if (existing) {
    pilotDbSeeded = true;
    return;
  }

  await prisma.organizerAccount.create({
    data: {
      id: DEMO_ORGANIZER_ID,
      slug: 'hempstead-chamber',
      name: PILOT_ORGANIZER.contactName,
      email: PILOT_ORGANIZER.email,
      organization: PILOT_ORGANIZER.organization,
      region: PILOT_ORGANIZER.region,
      verified: true,
      planId: PILOT_ORGANIZER.planId,
    },
  });

  for (const series of mockEventSeries.filter(s => s.organizerId === DEMO_ORGANIZER_ID)) {
    await prisma.eventSeries.upsert({
      where: { id: series.id },
      create: {
        id: series.id,
        slug: series.slug,
        name: series.name,
        description: series.description,
        organizerId: DEMO_ORGANIZER_ID,
        seasonLabel: series.seasonLabel,
        coverImageUrl: series.coverImageUrl,
        events: {
          create: series.eventIds.map(eventId => ({ eventId })),
        },
      },
      update: {
        name: series.name,
        seasonLabel: series.seasonLabel,
      },
    });
  }

  for (const sub of mockVendorSubmissions) {
    const uploaded = sub.documents.map(d => d.type);
    await prisma.vendorApplication.upsert({
      where: { id: sub.id },
      create: {
        id: sub.id,
        organizerId: DEMO_ORGANIZER_ID,
        eventId: sub.eventId,
        eventName: sub.eventName,
        vendorEmail: sub.vendorEmail,
        vendorName: sub.vendorName,
        category: sub.category,
        message: sub.message,
        status: sub.status,
        pipelineStage: sub.pipelineStage ?? 'applied',
        shortlisted: sub.shortlisted ?? false,
        infoRequested: sub.infoRequested ?? false,
        requiredForms: JSON.stringify(sub.requiredForms),
        uploadedDocTypes: JSON.stringify(uploaded),
        setupPhotoUrl: sub.setupPhotoUrl,
        hasInsurance: sub.hasInsurance,
        paymentStatus: sub.paymentStatus ?? 'none',
        contractStatus: sub.contractStatus ?? 'unsigned',
        createdAt: new Date(sub.submittedAt),
      },
      update: {
        status: sub.status,
        pipelineStage: sub.pipelineStage ?? 'applied',
        paymentStatus: sub.paymentStatus ?? 'none',
        contractStatus: sub.contractStatus ?? 'unsigned',
      },
    });
  }

  const boothMap = await prisma.boothMap.upsert({
    where: {
      organizerId_eventId: {
        organizerId: DEMO_ORGANIZER_ID,
        eventId: 'evt-001',
      },
    },
    create: {
      organizerId: DEMO_ORGANIZER_ID,
      eventId: 'evt-001',
      name: 'Spring Family Festival — Main grid',
      gridJson: JSON.stringify(DEFAULT_BOOTH_GRID),
    },
    update: {
      gridJson: JSON.stringify(DEFAULT_BOOTH_GRID),
    },
  });

  const glowApp = await prisma.vendorApplication.findUnique({ where: { id: 'sub-001' } });
  if (glowApp) {
    await prisma.boothAssignment.upsert({
      where: { applicationId: 'sub-001' },
      create: {
        boothMapId: boothMap.id,
        boothLabel: 'B-1',
        applicationId: 'sub-001',
        vendorEmail: glowApp.vendorEmail,
        vendorName: glowApp.vendorName,
        utilities: JSON.stringify(['electric']),
      },
      update: {
        boothLabel: 'B-1',
        vendorEmail: glowApp.vendorEmail,
        vendorName: glowApp.vendorName,
      },
    });
  }

  for (const eventId of ['evt-001', 'evt-007']) {
    await prisma.eventTimeline.upsert({
      where: {
        organizerId_eventId: { organizerId: DEMO_ORGANIZER_ID, eventId },
      },
      create: {
        organizerId: DEMO_ORGANIZER_ID,
        eventId,
        currentStage: eventId === 'evt-001' ? 'booth_assignment' : 'review',
        stagesJson: JSON.stringify(
          defaultTimelineStages(eventId === 'evt-001' ? 'booth_assignment' : 'review')
        ),
      },
      update: {},
    });
  }

  const feedCount = await prisma.activityFeedItem.count({
    where: { organizerId: DEMO_ORGANIZER_ID },
  });

  if (feedCount === 0) {
    await emitActivity({
      organizerId: DEMO_ORGANIZER_ID,
      eventType: WorkflowEventType.APPLICATION_SUBMITTED,
      actorType: 'vendor',
      actorLabel: 'Smokin\' BBQ Co.',
      targetType: 'application',
      targetId: 'sub-004',
      targetLabel: 'Classic Cars on the Hudson',
      title: 'New application submitted',
      summary: 'Smokin\' BBQ Co. applied to Classic Cars on the Hudson',
      eventId: 'evt-009',
    });
    await emitActivity({
      organizerId: DEMO_ORGANIZER_ID,
      eventType: WorkflowEventType.APPLICATION_APPROVED,
      actorType: 'organizer',
      actorLabel: PILOT_ORGANIZER.contactName,
      targetType: 'application',
      targetId: 'sub-001',
      targetLabel: 'Glow Toys NJ',
      title: 'Vendor approved',
      summary: 'Glow Toys NJ confirmed for Spring Family Festival',
      eventId: 'evt-001',
    });
    await emitActivity({
      organizerId: DEMO_ORGANIZER_ID,
      eventType: WorkflowEventType.BOOTH_ASSIGNED,
      actorType: 'organizer',
      actorLabel: PILOT_ORGANIZER.contactName,
      targetType: 'booth',
      targetId: 'B-1',
      targetLabel: 'Glow Toys NJ',
      title: 'Booth B-1 assigned',
      summary: 'Glow Toys NJ mapped to booth B-1 with electric',
      eventId: 'evt-001',
      metadata: { utilities: ['electric'] },
    });
    await emitActivity({
      organizerId: DEMO_ORGANIZER_ID,
      eventType: WorkflowEventType.DOCUMENT_MISSING,
      actorType: 'system',
      targetType: 'application',
      targetId: 'sub-003',
      targetLabel: 'Retro Arcade Mini',
      title: 'Missing documents detected',
      summary: 'CE200 and W-9 still required for Retro Arcade Mini',
      eventId: 'evt-006',
      metadata: { missing: ['ce200', 'w9'] },
    });
    await emitActivity({
      organizerId: DEMO_ORGANIZER_ID,
      eventType: WorkflowEventType.PAYMENT_RECEIVED,
      actorType: 'vendor',
      actorLabel: 'Glow Toys NJ',
      targetType: 'payment',
      targetId: 'sub-001',
      targetLabel: 'Deposit — Spring Family Festival',
      title: 'Payment received',
      summary: 'Deposit payment received from Glow Toys NJ',
      eventId: 'evt-001',
    });
  }

  pilotDbSeeded = true;
}

export async function resetPilotDbSeed() {
  pilotDbSeeded = false;
  await prisma.notification.deleteMany({ where: { organizerId: DEMO_ORGANIZER_ID } });
  await prisma.activityFeedItem.deleteMany({ where: { organizerId: DEMO_ORGANIZER_ID } });
  await prisma.auditLog.deleteMany({ where: { organizerId: DEMO_ORGANIZER_ID } });
  await prisma.boothAssignment.deleteMany({
    where: { boothMap: { organizerId: DEMO_ORGANIZER_ID } },
  });
  await prisma.boothMap.deleteMany({ where: { organizerId: DEMO_ORGANIZER_ID } });
  await prisma.eventTimeline.deleteMany({ where: { organizerId: DEMO_ORGANIZER_ID } });
  await prisma.vendorApplication.deleteMany({ where: { organizerId: DEMO_ORGANIZER_ID } });
  await prisma.organizerAccount.delete({ where: { id: DEMO_ORGANIZER_ID } }).catch(() => {});
  await ensurePilotDbSeed();
}
