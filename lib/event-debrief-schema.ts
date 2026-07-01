export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface EventDebriefRecord {
  id: string;
  vendorEmail: string;
  eventId?: string;
  applicationId?: string;
  eventName: string;
  eventDate: string;
  status: 'booked' | 'completed';

  notes: string;
  issues: string;
  bringNextTime: string;
  missedOpportunities: string;
  topSellers: string;
  crowdRating?: number;

  weatherSummary?: string;
  weatherHighF?: number;
  weatherLowF?: number;
  weatherPrecipPct?: number;
  weatherCondition?: string;

  checklist: ChecklistItem[];

  grossSales?: number;
  expenses?: number;
  netProfit?: number;
  margin?: number;
  breakEvenHour?: string;
  bestHour?: string;
  cashPercent?: number;
  cardPercent?: number;
  financialId?: string;

  createdAt: string;
  updatedAt: string;
}

export type EventDebriefInput = Omit<
  EventDebriefRecord,
  'id' | 'createdAt' | 'updatedAt' | 'vendorEmail'
> & { id?: string };

export const DEFAULT_CHECKLIST_LABELS = [
  'Load vehicle',
  'Confirm booth location',
  'Setup canopy & table',
  'Display inventory',
  'Test card reader',
  'Pack rain cover / weights',
];

export function buildDefaultChecklist(labels = DEFAULT_CHECKLIST_LABELS): ChecklistItem[] {
  return labels.map((label, i) => ({
    id: `chk-${i}`,
    label,
    done: false,
  }));
}

export function parseChecklistJson(raw: string): ChecklistItem[] {
  try {
    const parsed = JSON.parse(raw) as ChecklistItem[];
    if (!Array.isArray(parsed)) return buildDefaultChecklist();
    return parsed.filter(i => i && typeof i.label === 'string');
  } catch {
    return buildDefaultChecklist();
  }
}

export function serializeChecklist(items: ChecklistItem[]): string {
  return JSON.stringify(items);
}

export function normalizeEventName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function debriefKey(eventName: string, eventDate: string): string {
  return `${normalizeEventName(eventName)}|${eventDate}`;
}

export function centsToDollars(cents?: number | null): number | undefined {
  if (cents == null) return undefined;
  return cents / 100;
}

export function dollarsToCents(dollars?: number | null): number | undefined {
  if (dollars == null) return undefined;
  return Math.round(dollars * 100);
}
