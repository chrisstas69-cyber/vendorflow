import {
  mockCalendarEvents,
  mockEvents,
  type Application,
  type CalendarEvent,
} from '@/lib/mock-data';
import { mockPlatformEvents } from '@/lib/platform-data';

export interface VendorBookedEvent {
  id: string;
  eventId?: string;
  applicationId?: string;
  name: string;
  date: string;
  status: 'booked' | 'completed';
  boothFee?: number;
}

const CONFIRMED_STATUSES = new Set<Application['status']>(['paid', 'booked']);

function resolveEventDate(eventId?: string, eventName?: string): string {
  if (eventId) {
    const mock = mockEvents.find(e => e.id === eventId);
    if (mock) return mock.date;
    const platform = mockPlatformEvents.find(e => e.id === eventId);
    if (platform) return platform.date;
  }
  const calendar = mockCalendarEvents.find(e => e.name === eventName);
  return calendar?.date ?? '';
}

function fromCalendarEvent(cal: CalendarEvent): VendorBookedEvent {
  const mock = mockEvents.find(e => e.name === cal.name);
  return {
    id: cal.eventId ?? mock?.id ?? `cal-${cal.date}`,
    eventId: cal.eventId ?? mock?.id,
    name: cal.name,
    date: cal.date,
    status: cal.status,
    boothFee: mock?.boothFee,
  };
}

/** Booked / completed events for vendor payment import linking */
export function getVendorBookedEvents(applications: Application[]): VendorBookedEvent[] {
  const byId = new Map<string, VendorBookedEvent>();

  for (const cal of mockCalendarEvents) {
    const entry = fromCalendarEvent(cal);
    byId.set(entry.id, entry);
  }

  for (const app of applications) {
    if (!CONFIRMED_STATUSES.has(app.status)) continue;
    const id = app.eventId ?? app.id;
    if (byId.has(id)) continue;
    byId.set(id, {
      id,
      eventId: app.eventId,
      applicationId: app.id,
      name: app.eventName,
      date: resolveEventDate(app.eventId, app.eventName),
      status: 'booked',
      boothFee: app.boothFee,
    });
  }

  return Array.from(byId.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function formatBookedEventLabel(event: VendorBookedEvent): string {
  const dateLabel = event.date
    ? new Date(`${event.date}T12:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date TBD';
  const statusLabel = event.status === 'completed' ? 'completed' : 'booked';
  return `${event.name} — ${dateLabel} (${statusLabel})`;
}
