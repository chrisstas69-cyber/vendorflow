import type { UserRole } from '@/lib/platform-data';
import { DEMO_ORGANIZER_ID, mockEventSeries, mockPlatformEvents } from '@/lib/platform-data';
import { getApplicationsInbox, listOrganizerEvents } from '@/lib/organizer-server-store';
import { getOrCreatePassport } from '@/lib/vendor-passport-store';
import { validatePassport } from '@/lib/vendor-passport';
import { DEMO_VENDOR_EMAIL } from '@/lib/vendor-passport';

export interface AssistantContext {
  role: UserRole;
  timestamp: string;
  summary: string;
  blocks: Record<string, unknown>;
}

export function assembleAssistantContext(role: UserRole, userId?: string): AssistantContext {
  const blocks: Record<string, unknown> = {};

  if (role === 'organizer') {
    const organizerId = userId ?? DEMO_ORGANIZER_ID;
    const inbox = getApplicationsInbox({ organizerId });
    const events = listOrganizerEvents(organizerId);
    const series = mockEventSeries.filter(s => s.organizerId === organizerId);

    blocks.organizer = {
      id: organizerId,
      pendingApplications: inbox.items.filter(i => i.pipelineStage === 'applied').length,
      reviewing: inbox.items.filter(i => i.pipelineStage === 'reviewing').length,
      series: series.map(s => ({ name: s.name, season: s.seasonLabel, eventCount: s.eventIds.length })),
      upcomingEvents: events.slice(0, 5).map(e => ({
        id: e.id,
        name: e.name,
        date: e.date,
        slotsOpen: e.vendorSlots - e.vendorSlotsFilled,
        deadline: e.applicationDeadline,
      })),
      permitDeadlines: events
        .filter(e => e.applicationDeadline)
        .map(e => ({ event: e.name, deadline: e.applicationDeadline })),
    };

    return {
      role,
      timestamp: new Date().toISOString(),
      summary: `${inbox.items.length} applications across ${events.length} events`,
      blocks,
    };
  }

  const passport = getOrCreatePassport(userId ?? DEMO_VENDOR_EMAIL);
  const upcoming = mockPlatformEvents
    .filter(e => e.listingStatus === 'published')
    .slice(0, 8)
    .map(e => ({
      id: e.id,
      name: e.name,
      date: e.date,
      city: e.city,
      boothFee: e.boothFee,
      slotsOpen: e.vendorSlots - e.vendorSlotsFilled,
    }));

  blocks.vendor = {
    email: passport.vendorEmail,
    business: passport.businessName,
    categories: passport.categories,
    validationState: validatePassport(passport).state,
    documents: passport.documents.map(d => d.type),
    upcomingEvents: upcoming,
  };

  return {
    role,
    timestamp: new Date().toISOString(),
    summary: `${passport.businessName} — ${passport.categories.join(', ') || 'no categories'}`,
    blocks,
  };
}

/** Strip secrets / PII beyond what the assistant needs */
export function sanitizeContextForPrompt(ctx: AssistantContext): string {
  return JSON.stringify(
    {
      role: ctx.role,
      summary: ctx.summary,
      ...ctx.blocks,
    },
    null,
    2
  );
}
