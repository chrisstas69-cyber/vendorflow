import { mockEvents } from '@/lib/mock-data';
import { mockPlatformEvents, type PlatformEvent } from '@/lib/platform-data';

export interface EventSummary {
  id: string;
  name: string;
  date: string;
  boothFee?: number;
}

/**
 * Single lookup across both event catalogs (vendor mock events + platform
 * events). Use this instead of ad-hoc `mockEvents.find` / `mockPlatformEvents.find`
 * chains so every surface resolves the same event the same way.
 */
export function findEventById(eventId: string): EventSummary | undefined {
  const mock = mockEvents.find(e => e.id === eventId);
  if (mock) return { id: mock.id, name: mock.name, date: mock.date, boothFee: mock.boothFee };
  const platform = mockPlatformEvents.find(e => e.id === eventId);
  if (platform) return { id: platform.id, name: platform.name, date: platform.date };
  return undefined;
}

export function findEventByName(eventName: string): EventSummary | undefined {
  const mock = mockEvents.find(e => e.name === eventName);
  if (mock) return { id: mock.id, name: mock.name, date: mock.date, boothFee: mock.boothFee };
  const platform = mockPlatformEvents.find(e => e.name === eventName);
  if (platform) return { id: platform.id, name: platform.name, date: platform.date };
  return undefined;
}

export function findPlatformEventById(eventId: string): PlatformEvent | undefined {
  return mockPlatformEvents.find(e => e.id === eventId);
}
