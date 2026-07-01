import type { EventDebriefInput, EventDebriefRecord } from '@/lib/event-debrief-schema';
import {
  buildDefaultChecklist,
  debriefKey,
  parseChecklistJson,
  serializeChecklist,
} from '@/lib/event-debrief-schema';
import { buildSeedEventDebriefs } from '@/lib/event-debrief-seed-data';

let debriefs: EventDebriefRecord[] = [];

export function ensureDebriefSeedStore() {
  if (debriefs.length === 0) {
    debriefs = buildSeedEventDebriefs();
  }
}

export function listDebriefsSeed(vendorEmail: string): EventDebriefRecord[] {
  ensureDebriefSeedStore();
  return debriefs
    .filter(d => d.vendorEmail === vendorEmail)
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate));
}

export function getDebriefSeed(id: string): EventDebriefRecord | null {
  ensureDebriefSeedStore();
  return debriefs.find(d => d.id === id) ?? null;
}

export function upsertDebriefSeed(
  vendorEmail: string,
  input: EventDebriefInput
): EventDebriefRecord {
  ensureDebriefSeedStore();
  const now = new Date().toISOString();
  const key = debriefKey(input.eventName, input.eventDate);
  const idx = debriefs.findIndex(
    d => d.vendorEmail === vendorEmail && debriefKey(d.eventName, d.eventDate) === key
  );

  const record: EventDebriefRecord = {
    id: input.id ?? (idx >= 0 ? debriefs[idx].id : `deb-${Date.now()}`),
    vendorEmail,
    eventId: input.eventId,
    applicationId: input.applicationId,
    eventName: input.eventName,
    eventDate: input.eventDate,
    status: input.status,
    notes: input.notes ?? '',
    issues: input.issues ?? '',
    bringNextTime: input.bringNextTime ?? '',
    missedOpportunities: input.missedOpportunities ?? '',
    topSellers: input.topSellers ?? '',
    crowdRating: input.crowdRating,
    weatherSummary: input.weatherSummary,
    weatherHighF: input.weatherHighF,
    weatherLowF: input.weatherLowF,
    weatherPrecipPct: input.weatherPrecipPct,
    weatherCondition: input.weatherCondition,
    checklist: input.checklist ?? buildDefaultChecklist(),
    grossSales: input.grossSales,
    expenses: input.expenses,
    netProfit: input.netProfit,
    margin: input.margin,
    breakEvenHour: input.breakEvenHour,
    bestHour: input.bestHour,
    cashPercent: input.cashPercent,
    cardPercent: input.cardPercent,
    financialId: input.financialId,
    createdAt: idx >= 0 ? debriefs[idx].createdAt : now,
    updatedAt: now,
  };

  if (idx >= 0) debriefs[idx] = record;
  else debriefs.unshift(record);
  return record;
}

export function deleteDebriefSeed(id: string): boolean {
  ensureDebriefSeedStore();
  const before = debriefs.length;
  debriefs = debriefs.filter(d => d.id !== id);
  return debriefs.length < before;
}

export function replaceDebriefsSeed(vendorEmail: string, items: EventDebriefRecord[]) {
  ensureDebriefSeedStore();
  debriefs = debriefs.filter(d => d.vendorEmail !== vendorEmail).concat(items);
}

export { parseChecklistJson, serializeChecklist };
