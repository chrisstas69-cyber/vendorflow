/**
 * Consumer interest (RSVP / save) — local-first for pilot, optional Postgres when hosted.
 * Key insight: interest counts are the retention hook for vendors + organizers.
 */

const STORAGE_KEY = 'vendorflow-event-interest-v1';
const LEGACY_DEVICE_KEY = 'vendorflow-interest-device-id';

export type InterestKind = 'save' | 'rsvp';

export interface EventInterestRecord {
  eventId: string;
  kind: InterestKind;
  createdAt: string;
}

interface InterestStore {
  deviceId: string;
  items: EventInterestRecord[];
}

function blankStore(): InterestStore {
  return {
    deviceId:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `dev-${Date.now()}`,
    items: [],
  };
}

function readStore(): InterestStore {
  if (typeof window === 'undefined') return blankStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const store = blankStore();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      localStorage.setItem(LEGACY_DEVICE_KEY, store.deviceId);
      return store;
    }
    const parsed = JSON.parse(raw) as InterestStore;
    if (!parsed.deviceId || !Array.isArray(parsed.items)) return blankStore();
    return parsed;
  } catch {
    return blankStore();
  }
}

function writeStore(store: InterestStore) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/** Global counts keyed by eventId — shared across devices via localStorage aggregation is per-device;
 *  for pilot we also bump PlatformEvent.saves in demo store when toggled from UI. */
const COUNT_KEY = 'vendorflow-event-interest-counts-v1';

function readCounts(): Record<string, { saves: number; rsvps: number }> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(COUNT_KEY) || '{}') as Record<
      string,
      { saves: number; rsvps: number }
    >;
  } catch {
    return {};
  }
}

function writeCounts(counts: Record<string, { saves: number; rsvps: number }>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COUNT_KEY, JSON.stringify(counts));
}

export function getInterestDeviceId(): string {
  return readStore().deviceId;
}

export function getDeviceInterest(eventId: string, kind: InterestKind = 'save'): boolean {
  const store = readStore();
  return store.items.some(i => i.eventId === eventId && i.kind === kind);
}

export function getInterestCounts(eventId: string): { saves: number; rsvps: number } {
  const counts = readCounts();
  return counts[eventId] ?? { saves: 0, rsvps: 0 };
}

export function listSavedEventIds(kind: InterestKind = 'save'): string[] {
  return readStore()
    .items.filter(i => i.kind === kind)
    .map(i => i.eventId);
}

/** Toggle save/RSVP for this device. Returns new state + updated public counts. */
export function toggleInterest(
  eventId: string,
  kind: InterestKind = 'save'
): { active: boolean; counts: { saves: number; rsvps: number } } {
  const store = readStore();
  const counts = readCounts();
  const existing = store.items.findIndex(i => i.eventId === eventId && i.kind === kind);
  const bucket = counts[eventId] ?? { saves: 0, rsvps: 0 };

  let active: boolean;
  if (existing >= 0) {
    store.items.splice(existing, 1);
    active = false;
    if (kind === 'save') bucket.saves = Math.max(0, bucket.saves - 1);
    else bucket.rsvps = Math.max(0, bucket.rsvps - 1);
  } else {
    store.items.push({ eventId, kind, createdAt: new Date().toISOString() });
    active = true;
    if (kind === 'save') bucket.saves += 1;
    else bucket.rsvps += 1;
  }

  counts[eventId] = bucket;
  writeStore(store);
  writeCounts(counts);
  return { active, counts: bucket };
}

export function seedInterestCount(eventId: string, saves: number, rsvps = 0) {
  const counts = readCounts();
  const current = counts[eventId] ?? { saves: 0, rsvps: 0 };
  counts[eventId] = {
    saves: Math.max(current.saves, saves),
    rsvps: Math.max(current.rsvps, rsvps),
  };
  writeCounts(counts);
}
