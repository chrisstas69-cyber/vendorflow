import type { BoothCell } from '@/components/organizer/booth-map-editor';
import {
  DEFAULT_STREET_FAIR_LAYOUT,
  type EventLayoutState,
  type LayoutMode,
  type StreetFairLayoutDefinition,
} from '@/lib/booth/street-fair-schema';
import { generateBoothInventory } from '@/lib/booth/street-fair-generate';

const DEFAULT_GRID: BoothCell[] = [
  { id: 'A-1', label: 'A-1', utilities: ['electric'] },
  { id: 'A-2', label: 'A-2', utilities: [] },
  { id: 'A-3', label: 'A-3', utilities: ['electric', 'water'] },
  { id: 'B-1', label: 'B-1', utilities: ['electric'] },
  { id: 'B-2', label: 'B-2', utilities: [] },
  { id: 'B-3', label: 'B-3', utilities: [] },
];

type Assignment = {
  boothLabel: string;
  vendorName: string;
  vendorEmail: string;
  applicationId?: string;
};

const layoutByEvent = new Map<string, EventLayoutState>();
const assignmentsByEvent = new Map<string, Assignment[]>();

function key(organizerId: string, eventId: string) {
  return `${organizerId}:${eventId}`;
}

export function getEventLayoutSeed(organizerId: string, eventId: string): EventLayoutState {
  const k = key(organizerId, eventId);
  if (!layoutByEvent.has(k)) {
    layoutByEvent.set(k, {
      layoutMode: eventId === 'evt-005' ? 'street-fair' : 'grid',
      grid: DEFAULT_GRID,
      streetFair: DEFAULT_STREET_FAIR_LAYOUT,
      generatedBooths: generateBoothInventory(DEFAULT_STREET_FAIR_LAYOUT),
    });
  }
  const state = layoutByEvent.get(k)!;
  const assignments = assignmentsByEvent.get(k) ?? [];
  const assignmentMap = new Map(assignments.map(a => [a.boothLabel, a]));

  if (state.layoutMode === 'street-fair') {
    state.generatedBooths = generateBoothInventory(state.streetFair, assignmentMap);
  } else {
    state.grid = state.grid.map(b => {
      const a = assignmentMap.get(b.label);
      return a
        ? { ...b, vendorName: a.vendorName, vendorEmail: a.vendorEmail, applicationId: a.applicationId }
        : b;
    });
  }

  return state;
}

export function updateEventLayoutSeed(
  organizerId: string,
  eventId: string,
  patch: {
    layoutMode?: LayoutMode;
    grid?: BoothCell[];
    streetFair?: StreetFairLayoutDefinition;
  }
): EventLayoutState {
  const current = getEventLayoutSeed(organizerId, eventId);
  const next: EventLayoutState = {
    ...current,
    ...patch,
    streetFair: patch.streetFair ?? current.streetFair,
    grid: patch.grid ?? current.grid,
  };
  if (next.layoutMode === 'street-fair') {
    const k = key(organizerId, eventId);
    const assignments = assignmentsByEvent.get(k) ?? [];
    const assignmentMap = new Map(assignments.map(a => [a.boothLabel, a]));
    next.generatedBooths = generateBoothInventory(next.streetFair, assignmentMap);
  }
  layoutByEvent.set(key(organizerId, eventId), next);
  return next;
}

export function persistAssignmentsSeed(
  organizerId: string,
  eventId: string,
  assignments: Assignment[]
): void {
  assignmentsByEvent.set(key(organizerId, eventId), assignments);
  getEventLayoutSeed(organizerId, eventId);
}
