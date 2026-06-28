import {
  DEMO_ORGANIZER_ID,
  mockEventSeries,
  mockPlatformEvents,
  mockVendorSubmissions,
  type EventSeries,
  type PlatformEvent,
  type VendorSubmission,
} from '@/lib/platform-data';
import {
  applyInboxAction,
  deriveDisplayStage,
  derivePipelineStage,
  missingDocTypes,
  type ContractStatus,
  type InboxAction,
  type OrganizerApplicationInboxItem,
  type OrganizerDisplayStage,
  type OrganizerPipelineStage,
  type PaymentStatus,
} from '@/lib/organizer-schema';

/** Server-side demo inbox — mirrors seeded data; resets on cold start in serverless */
let submissions: VendorSubmission[] = structuredClone(mockVendorSubmissions);
let events: PlatformEvent[] = structuredClone(mockPlatformEvents);
const series: EventSeries[] = structuredClone(mockEventSeries);

function eventForSubmission(sub: VendorSubmission): PlatformEvent | undefined {
  return events.find(e => e.id === sub.eventId);
}

function seriesForEvent(eventId: string): EventSeries | undefined {
  const event = events.find(e => e.id === eventId);
  if (!event?.seriesId) return undefined;
  return series.find(s => s.id === event.seriesId);
}

function toInboxItem(sub: VendorSubmission): OrganizerApplicationInboxItem {
  const event = eventForSubmission(sub);
  const ser = seriesForEvent(sub.eventId);
  const pipelineStage =
    sub.pipelineStage ??
    derivePipelineStage({
      status: sub.status,
      shortlisted: sub.shortlisted,
      infoRequested: sub.infoRequested,
    });

  const uploadedDocTypes = sub.documents.map(d => d.type);
  const missingDocs = missingDocTypes(sub.requiredForms, uploadedDocTypes);
  const paymentStatus: PaymentStatus = sub.paymentStatus ?? 'none';
  const contractStatus: ContractStatus = sub.contractStatus ?? 'unsigned';

  const displayStage = deriveDisplayStage({
    pipelineStage,
    status: sub.status,
    requiredForms: sub.requiredForms,
    uploadedDocTypes,
    boothId: sub.boothId,
    paymentStatus,
    eventDate: event?.date,
    infoRequested: sub.infoRequested,
  });

  return {
    id: sub.id,
    submissionId: sub.id,
    eventId: sub.eventId,
    eventName: sub.eventName,
    seriesId: ser?.id,
    seriesName: ser?.name,
    vendorName: sub.vendorName,
    vendorEmail: sub.vendorEmail,
    category: sub.category,
    message: sub.message,
    pipelineStage,
    status: sub.status,
    submittedAt: sub.submittedAt,
    hasInsurance: sub.hasInsurance,
    setupPhotoUrl: sub.setupPhotoUrl,
    shortlisted: sub.shortlisted ?? false,
    infoRequested: sub.infoRequested ?? false,
    documentsCount: sub.documents.length,
    requiredForms: sub.requiredForms,
    uploadedDocTypes,
    missingDocTypes: missingDocs,
    boothId: sub.boothId,
    paymentStatus,
    contractStatus,
    displayStage,
  };
}

function ownedByDemoOrganizer(sub: VendorSubmission): boolean {
  const event = eventForSubmission(sub);
  return event?.organizerId === DEMO_ORGANIZER_ID;
}

export function resetOrganizerServerStore() {
  submissions = structuredClone(mockVendorSubmissions);
  events = structuredClone(mockPlatformEvents);
}

export function listSeries(organizerId: string = DEMO_ORGANIZER_ID) {
  return series.filter(s => s.organizerId === organizerId);
}

export function listOrganizerEvents(organizerId: string = DEMO_ORGANIZER_ID) {
  return events.filter(e => e.organizerId === organizerId);
}

export function getApplicationsInbox(filters: {
  organizerId?: string;
  eventId?: string;
  seriesId?: string;
  pipelineStage?: OrganizerPipelineStage;
}) {
  const organizerId = filters.organizerId ?? DEMO_ORGANIZER_ID;

  let items = submissions.filter(ownedByDemoOrganizer).map(toInboxItem);

  if (filters.eventId) {
    items = items.filter(i => i.eventId === filters.eventId);
  }

  if (filters.seriesId) {
    items = items.filter(i => i.seriesId === filters.seriesId);
  }

  if (filters.pipelineStage) {
    items = items.filter(i => i.pipelineStage === filters.pipelineStage);
  }

  items.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

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
  const projectedRevenueCents = items
    .filter(i => i.status === 'approved' || i.displayStage === 'paid' || i.displayStage === 'mapped')
    .reduce((sum, item) => {
      const ev = events.find(e => e.id === item.eventId);
      return sum + (ev?.boothFee ?? 350) * 100;
    }, 0);

  const seasonMetrics = {
    eventCount: listOrganizerEvents(organizerId).filter(e =>
      filters.seriesId ? e.seriesId === filters.seriesId : true
    ).length,
    applicationCount: items.length,
    approvedCount,
    docsCompletePct: items.length ? Math.round((docsComplete / items.length) * 100) : 0,
    projectedRevenueCents,
    openSlots: listOrganizerEvents(organizerId)
      .filter(e => (filters.seriesId ? e.seriesId === filters.seriesId : true))
      .reduce((s, e) => s + (e.vendorSlots - e.vendorSlotsFilled), 0),
  };

  return {
    items,
    counts,
    displayCounts,
    seasonMetrics,
    series: listSeries(organizerId),
    events: listOrganizerEvents(organizerId),
  };
}

export function performInboxAction(submissionId: string, action: InboxAction) {
  const idx = submissions.findIndex(s => s.id === submissionId);
  if (idx === -1) return { ok: false as const, error: 'Application not found' };

  const sub = submissions[idx];
  const currentStage =
    sub.pipelineStage ??
    derivePipelineStage({
      status: sub.status,
      shortlisted: sub.shortlisted,
      infoRequested: sub.infoRequested,
    });

  const next = applyInboxAction(currentStage, action);

  const updated: VendorSubmission = {
    ...sub,
    status: next.status,
    pipelineStage: next.pipelineStage,
    shortlisted: action === 'request_info' ? true : sub.shortlisted,
    infoRequested: action === 'request_info' ? true : sub.infoRequested,
  };

  submissions[idx] = updated;

  if (action === 'accept') {
    const eventIdx = events.findIndex(e => e.id === sub.eventId);
    if (eventIdx >= 0) {
      const ev = events[eventIdx];
      events[eventIdx] = {
        ...ev,
        vendorSlotsFilled: Math.min(ev.vendorSlotsFilled + 1, ev.vendorSlots),
      };
    }
  }

  return { ok: true as const, item: toInboxItem(updated) };
}

export function upsertSubmission(sub: VendorSubmission) {
  const idx = submissions.findIndex(s => s.id === sub.id);
  if (idx >= 0) submissions[idx] = sub;
  else submissions.unshift(sub);
  return toInboxItem(sub);
}

export function getServerSubmissions() {
  return submissions;
}

export function syncServerSubmissions(next: VendorSubmission[]) {
  submissions = next;
}

export function syncServerEvents(next: PlatformEvent[]) {
  events = next;
}
