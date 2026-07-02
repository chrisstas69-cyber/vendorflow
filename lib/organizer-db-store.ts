import { prisma } from '@/lib/prisma';
import {
  mockEventSeries,
  mockPlatformEvents,
  type EventSeries,
  type PlatformEvent,
} from '@/lib/platform-data';
import {
  applyInboxAction,
  deriveDisplayStage,
  derivePipelineStage,
  missingDocTypes,
  type ContractStatus,
  type InboxAction,
  type OrganizerApplicationInboxItem,
  type OrganizerPipelineStage,
  type PaymentStatus,
} from '@/lib/organizer-schema';
import { ensurePilotDbSeed } from '@/lib/pilot-db-seed';
import { emitActivity, writeAuditLog, parseActivityMetadata } from '@/lib/workflow/emit-activity';
import { WorkflowEventType } from '@/lib/workflow/event-types';
import type { ActivityFeedDTO } from '@/lib/workflow/event-types';
import { generateBoothInventory } from '@/lib/booth/street-fair-generate';
import type { LayoutMode, StreetFairLayoutDefinition } from '@/lib/booth/street-fair-schema';
import { getActiveOrganizerId } from '@/lib/pilot-config';

function parseJsonArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function eventForId(eventId: string): PlatformEvent | undefined {
  return mockPlatformEvents.find(e => e.id === eventId);
}

function seriesForEvent(eventId: string): EventSeries | undefined {
  const event = eventForId(eventId);
  if (!event?.seriesId) return undefined;
  return mockEventSeries.find(s => s.id === event.seriesId);
}

function toInboxItem(
  app: Awaited<ReturnType<typeof loadApplications>>[number]
): OrganizerApplicationInboxItem {
  const event = eventForId(app.eventId);
  const ser = seriesForEvent(app.eventId);
  const requiredForms = parseJsonArray(app.requiredForms);
  const uploadedDocTypes = parseJsonArray(app.uploadedDocTypes);
  const missingDocs = missingDocTypes(requiredForms, uploadedDocTypes);
  const pipelineStage = (app.pipelineStage as OrganizerPipelineStage) ?? derivePipelineStage({
    status: app.status as 'pending' | 'approved' | 'rejected',
    shortlisted: app.shortlisted,
    infoRequested: app.infoRequested,
  });
  const paymentStatus = (app.paymentStatus as PaymentStatus) ?? 'none';
  const contractStatus = (app.contractStatus as ContractStatus) ?? 'unsigned';
  const boothId = app.boothAssignment?.boothLabel;

  const displayStage = deriveDisplayStage({
    pipelineStage,
    status: app.status as 'pending' | 'approved' | 'rejected',
    requiredForms,
    uploadedDocTypes,
    boothId,
    paymentStatus,
    eventDate: event?.date,
    infoRequested: app.infoRequested,
  });

  return {
    id: app.id,
    submissionId: app.id,
    eventId: app.eventId,
    eventName: app.eventName,
    seriesId: ser?.id,
    seriesName: ser?.name,
    vendorName: app.vendorName,
    vendorEmail: app.vendorEmail,
    category: app.category,
    message: app.message,
    pipelineStage,
    status: app.status as 'pending' | 'approved' | 'rejected',
    submittedAt: app.createdAt.toISOString(),
    hasInsurance: app.hasInsurance,
    setupPhotoUrl: app.setupPhotoUrl ?? undefined,
    shortlisted: app.shortlisted,
    infoRequested: app.infoRequested,
    documentsCount: uploadedDocTypes.length,
    requiredForms,
    uploadedDocTypes,
    missingDocTypes: missingDocs,
    boothId,
    paymentStatus,
    contractStatus: contractStatus,
    displayStage,
    internalNotes: app.internalNotes || undefined,
  };
}

async function loadApplications(organizerId: string) {
  return prisma.vendorApplication.findMany({
    where: { organizerId },
    include: { boothAssignment: true },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
}

export async function getApplicationsInboxFromDb(filters: {
  organizerId?: string;
  eventId?: string;
  seriesId?: string;
  pipelineStage?: OrganizerPipelineStage;
}) {
  await ensurePilotDbSeed();
  const organizerId = filters.organizerId ?? getActiveOrganizerId();

  let apps = await loadApplications(organizerId);

  if (filters.eventId) {
    apps = apps.filter(a => a.eventId === filters.eventId);
  }
  if (filters.seriesId) {
    const eventIds = mockEventSeries
      .find(s => s.id === filters.seriesId)
      ?.eventIds ?? [];
    apps = apps.filter(a => eventIds.includes(a.eventId));
  }
  if (filters.pipelineStage) {
    apps = apps.filter(a => a.pipelineStage === filters.pipelineStage);
  }

  const items = apps.map(toInboxItem);

  const counts = {
    scraped: items.filter(i => i.pipelineStage === 'scraped').length,
    applied: items.filter(i => i.pipelineStage === 'applied').length,
    reviewing: items.filter(i => i.pipelineStage === 'reviewing').length,
    approved: items.filter(i => i.pipelineStage === 'approved').length,
    waitlisted: items.filter(i => i.pipelineStage === 'waitlisted').length,
  };

  const displayCounts = {
    applied: items.filter(i => i.displayStage === 'applied').length,
    docs: items.filter(i => i.displayStage === 'docs').length,
    approved: items.filter(i => i.displayStage === 'approved').length,
    mapped: items.filter(i => i.displayStage === 'mapped').length,
    paid: items.filter(i => i.displayStage === 'paid').length,
    completed: items.filter(i => i.displayStage === 'completed').length,
  };

  const approvedCount = items.filter(i => i.status === 'approved').length;
  const docsComplete = items.filter(i => i.missingDocTypes.length === 0).length;
  const events = mockPlatformEvents.filter(e => e.organizerId === organizerId);
  const filteredEvents = filters.seriesId
    ? events.filter(e => e.seriesId === filters.seriesId)
    : events;

  const projectedRevenueCents = items
    .filter(i => i.status === 'approved' || i.displayStage === 'paid' || i.displayStage === 'mapped')
    .reduce((sum, item) => {
      const ev = eventForId(item.eventId);
      return sum + (ev?.boothFee ?? 350) * 100;
    }, 0);

  return {
    items,
    counts,
    displayCounts,
    seasonMetrics: {
      eventCount: filteredEvents.length,
      applicationCount: items.length,
      approvedCount,
      docsCompletePct: items.length ? Math.round((docsComplete / items.length) * 100) : 0,
      projectedRevenueCents,
      openSlots: filteredEvents.reduce((s, e) => s + (e.vendorSlots - e.vendorSlotsFilled), 0),
    },
    series: mockEventSeries.filter(s => s.organizerId === organizerId),
    events,
    _meta: { dataSource: 'db' as const },
  };
}

export async function getApplicationByIdFromDb(id: string, organizerId?: string) {
  await ensurePilotDbSeed();
  const orgId = organizerId ?? getActiveOrganizerId();
  const app = await prisma.vendorApplication.findFirst({
    where: { id, organizerId: orgId },
    include: { boothAssignment: true },
  });
  if (!app) return null;
  return toInboxItem(app);
}

export async function performApplicationActionDb(
  submissionId: string,
  action: InboxAction,
  actorLabel = 'Organizer'
) {
  await ensurePilotDbSeed();
  const app = await prisma.vendorApplication.findUnique({
    where: { id: submissionId },
    include: { boothAssignment: true },
  });
  if (!app) return { ok: false as const, error: 'Application not found' };

  const currentStage = app.pipelineStage as OrganizerPipelineStage;
  const next = applyInboxAction(currentStage, action);

  const updated = await prisma.vendorApplication.update({
    where: { id: submissionId },
    data: {
      status: next.status,
      pipelineStage: next.pipelineStage,
      shortlisted: action === 'request_info' ? true : app.shortlisted,
      infoRequested: action === 'request_info' ? true : app.infoRequested,
    },
    include: { boothAssignment: true },
  });

  const item = toInboxItem(updated);

  const eventTypeMap: Record<InboxAction, string> = {
    accept: WorkflowEventType.APPLICATION_APPROVED,
    reject: WorkflowEventType.APPLICATION_REJECTED,
    waitlist: WorkflowEventType.APPLICATION_WAITLISTED,
    request_info: WorkflowEventType.APPLICATION_INFO_REQUESTED,
  };

  await emitActivity({
    organizerId: app.organizerId,
    eventType: eventTypeMap[action],
    actorType: 'organizer',
    actorLabel,
    targetType: 'application',
    targetId: app.id,
    targetLabel: app.vendorName,
    title: `${app.vendorName} — ${action.replace('_', ' ')}`,
    summary: item.message || undefined,
    eventId: app.eventId,
  });

  try {
    const { queueEmail } = await import('@/lib/email-queue');
    const org = await prisma.organizerAccount.findUnique({ where: { id: app.organizerId } });
    const templateId =
      action === 'accept'
        ? 'application_approved'
        : action === 'reject'
          ? 'application_rejected'
          : action === 'request_info'
            ? 'info_requested'
            : null;
    if (templateId) {
      await queueEmail({
        templateId,
        toEmail: app.vendorEmail,
        applicationId: app.id,
        organizerId: app.organizerId,
        vars: {
          vendorName: app.vendorName,
          eventName: app.eventName,
          organizerName: org?.organization,
        },
      });
    }
  } catch {
    /* optional */
  }

  await writeAuditLog({
    organizerId: app.organizerId,
    action: `application.${action}`,
    entityType: 'application',
    entityId: app.id,
    actorLabel,
    before: { status: app.status, pipelineStage: app.pipelineStage },
    after: { status: updated.status, pipelineStage: updated.pipelineStage },
    applicationId: app.id,
  });

  return { ok: true as const, item };
}

export async function createApplicationDb(input: {
  organizerId: string;
  eventId: string;
  eventName: string;
  vendorEmail: string;
  vendorName: string;
  category: string;
  message?: string;
  requiredForms?: string[];
  hasInsurance?: boolean;
  setupPhotoUrl?: string;
}) {
  await ensurePilotDbSeed();
  const passport = await prisma.vendorPassport.upsert({
    where: { vendorEmail: input.vendorEmail.toLowerCase().trim() },
    create: {
      vendorEmail: input.vendorEmail.toLowerCase().trim(),
      businessName: input.vendorName,
      contactName: input.vendorName,
    },
    update: {},
  });

  const app = await prisma.vendorApplication.create({
    data: {
      organizerId: input.organizerId,
      eventId: input.eventId,
      eventName: input.eventName,
      vendorEmail: input.vendorEmail,
      vendorName: input.vendorName,
      category: input.category,
      message: input.message ?? '',
      requiredForms: JSON.stringify(input.requiredForms ?? ['coi', 'w9']),
      pipelineStage: 'applied',
      status: 'pending',
      hasInsurance: input.hasInsurance ?? false,
      setupPhotoUrl: input.setupPhotoUrl ?? null,
      passportId: passport.id,
    },
    include: { boothAssignment: true },
  });

  await emitActivity({
    organizerId: input.organizerId,
    eventType: WorkflowEventType.APPLICATION_SUBMITTED,
    actorType: 'vendor',
    actorLabel: input.vendorName,
    targetType: 'application',
    targetId: app.id,
    targetLabel: input.eventName,
    title: 'New application submitted',
    summary: `${input.vendorName} applied to ${input.eventName}`,
    eventId: input.eventId,
  });

  return toInboxItem(app);
}

export async function getBoothMapFromDb(organizerId: string, eventId: string) {
  await ensurePilotDbSeed();
  const map = await prisma.boothMap.findUnique({
    where: { organizerId_eventId: { organizerId, eventId } },
    include: { assignments: true },
  });
  return map;
}

export async function updateBoothLayoutDb(input: {
  organizerId: string;
  eventId: string;
  layoutMode?: string;
  streetFair?: unknown;
  grid?: unknown[];
}) {
  await ensurePilotDbSeed();
  const { organizerId, eventId, layoutMode, streetFair, grid } = input;

  const data: {
    layoutMode?: string;
    streetFairJson?: string;
    gridJson?: string;
    name?: string;
  } = {};

  if (layoutMode) data.layoutMode = layoutMode;
  if (streetFair) data.streetFairJson = JSON.stringify(streetFair);
  if (grid) data.gridJson = JSON.stringify(grid);
  if (layoutMode === 'street-fair') data.name = `${eventId} street fair`;

  const boothMap = await prisma.boothMap.upsert({
    where: { organizerId_eventId: { organizerId, eventId } },
    create: {
      organizerId,
      eventId,
      name: data.name ?? `${eventId} booth layout`,
      layoutMode: layoutMode ?? 'grid',
      gridJson: data.gridJson ?? '[]',
      streetFairJson: data.streetFairJson ?? '{}',
    },
    update: data,
  });

  return boothMap;
}

export async function persistBoothAssignmentsDb(input: {
  organizerId: string;
  eventId: string;
  assignments: { boothLabel: string; applicationId?: string; vendorEmail: string; vendorName: string }[];
  actorLabel?: string;
}) {
  await ensurePilotDbSeed();
  const { organizerId, eventId, assignments, actorLabel = 'Organizer' } = input;

  let boothMap = await prisma.boothMap.findUnique({
    where: { organizerId_eventId: { organizerId, eventId } },
  });

  if (!boothMap) {
    boothMap = await prisma.boothMap.create({
      data: {
        organizerId,
        eventId,
        name: `${eventId} booth grid`,
        gridJson: '[]',
      },
    });
  }

  await prisma.boothAssignment.deleteMany({ where: { boothMapId: boothMap.id } });

  for (const a of assignments) {
    if (!a.applicationId) continue;
    await prisma.boothAssignment.create({
      data: {
        boothMapId: boothMap.id,
        boothLabel: a.boothLabel,
        applicationId: a.applicationId,
        vendorEmail: a.vendorEmail,
        vendorName: a.vendorName,
        utilities: JSON.stringify([]),
      },
    });

    await emitActivity({
      organizerId,
      eventType: WorkflowEventType.BOOTH_ASSIGNED,
      actorType: 'organizer',
      actorLabel,
      targetType: 'booth',
      targetId: a.boothLabel,
      targetLabel: a.vendorName,
      title: `Booth ${a.boothLabel} assigned`,
      summary: `${a.vendorName} mapped to booth ${a.boothLabel}`,
      eventId,
      metadata: { applicationId: a.applicationId },
    });
  }

  return getBoothMapFromDb(organizerId, eventId);
}

type BoothMapWithAssignments = NonNullable<Awaited<ReturnType<typeof getBoothMapFromDb>>>;

export async function getBoothLayoutResponseDb(map: BoothMapWithAssignments) {
  const streetFair = JSON.parse(map.streetFairJson || '{}') as StreetFairLayoutDefinition;
  const layoutMode = (map.layoutMode || 'grid') as LayoutMode;
  const grid = JSON.parse(map.gridJson || '[]');

  const assignmentMap = new Map(
    map.assignments.map(a => [
      a.boothLabel,
      {
        vendorName: a.vendorName,
        vendorEmail: a.vendorEmail,
        applicationId: a.applicationId ?? undefined,
      },
    ])
  );

  const assignments = map.assignments.map(a => ({
    boothLabel: a.boothLabel,
    applicationId: a.applicationId,
    vendorEmail: a.vendorEmail,
    vendorName: a.vendorName,
    utilities: JSON.parse(a.utilities || '[]'),
  }));

  const generatedBooths =
    layoutMode === 'street-fair' && streetFair.streets?.length
      ? generateBoothInventory(streetFair, assignmentMap)
      : [];

  return {
    layoutMode,
    grid,
    streetFair,
    generatedBooths,
    assignments,
  };
}

export async function getActivityFeedFromDb(
  organizerId: string,
  options?: { limit?: number; unreadOnly?: boolean }
) {
  await ensurePilotDbSeed();
  const limit = options?.limit ?? 50;

  const items = await prisma.activityFeedItem.findMany({
    where: {
      organizerId,
      ...(options?.unreadOnly ? { readAt: null } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const feed: ActivityFeedDTO[] = items.map(i => ({
    id: i.id,
    eventType: i.eventType,
    actorType: i.actorType,
    actorId: i.actorId,
    actorLabel: i.actorLabel,
    targetType: i.targetType,
    targetId: i.targetId,
    targetLabel: i.targetLabel,
    title: i.title,
    summary: i.summary,
    metadata: parseActivityMetadata(i.metadata),
    readAt: i.readAt?.toISOString() ?? null,
    eventId: i.eventId,
    createdAt: i.createdAt.toISOString(),
  }));

  const unreadCount = await prisma.activityFeedItem.count({
    where: { organizerId, readAt: null },
  });

  return { items: feed, unreadCount };
}

export async function markActivityReadDb(organizerId: string, ids: string[]) {
  await prisma.activityFeedItem.updateMany({
    where: { organizerId, id: { in: ids } },
    data: { readAt: new Date() },
  });
}
