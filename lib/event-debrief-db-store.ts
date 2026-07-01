import { prisma } from '@/lib/prisma';
import type { EventDebriefInput, EventDebriefRecord } from '@/lib/event-debrief-schema';
import {
  buildDefaultChecklist,
  centsToDollars,
  dollarsToCents,
  parseChecklistJson,
  serializeChecklist,
} from '@/lib/event-debrief-schema';
import { buildSeedEventDebriefs } from '@/lib/event-debrief-seed-data';
import { DEMO_VENDOR_EMAIL } from '@/lib/vendor-passport';

let dbSeeded = false;

function rowToRecord(row: {
  id: string;
  vendorEmail: string;
  eventId: string | null;
  applicationId: string | null;
  eventName: string;
  eventDate: string;
  status: string;
  notes: string;
  issues: string;
  bringNextTime: string;
  missedOpportunities: string;
  topSellers: string;
  crowdRating: number | null;
  weatherSummary: string | null;
  weatherHighF: number | null;
  weatherLowF: number | null;
  weatherPrecipPct: number | null;
  weatherCondition: string | null;
  checklistJson: string;
  grossSalesCents: number | null;
  expensesCents: number | null;
  netProfitCents: number | null;
  marginBps: number | null;
  breakEvenHour: string | null;
  bestHour: string | null;
  cashPercent: number | null;
  cardPercent: number | null;
  financialId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): EventDebriefRecord {
  return {
    id: row.id,
    vendorEmail: row.vendorEmail,
    eventId: row.eventId ?? undefined,
    applicationId: row.applicationId ?? undefined,
    eventName: row.eventName,
    eventDate: row.eventDate,
    status: row.status as 'booked' | 'completed',
    notes: row.notes,
    issues: row.issues,
    bringNextTime: row.bringNextTime,
    missedOpportunities: row.missedOpportunities,
    topSellers: row.topSellers,
    crowdRating: row.crowdRating ?? undefined,
    weatherSummary: row.weatherSummary ?? undefined,
    weatherHighF: row.weatherHighF ?? undefined,
    weatherLowF: row.weatherLowF ?? undefined,
    weatherPrecipPct: row.weatherPrecipPct ?? undefined,
    weatherCondition: row.weatherCondition ?? undefined,
    checklist: parseChecklistJson(row.checklistJson),
    grossSales: centsToDollars(row.grossSalesCents),
    expenses: centsToDollars(row.expensesCents),
    netProfit: centsToDollars(row.netProfitCents),
    margin: row.marginBps != null ? Math.round(row.marginBps / 100) : undefined,
    breakEvenHour: row.breakEvenHour ?? undefined,
    bestHour: row.bestHour ?? undefined,
    cashPercent: row.cashPercent ?? undefined,
    cardPercent: row.cardPercent ?? undefined,
    financialId: row.financialId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function inputToData(vendorEmail: string, input: EventDebriefInput, passportId?: string) {
  return {
    vendorEmail,
    vendorPassportId: passportId ?? null,
    eventId: input.eventId ?? null,
    applicationId: input.applicationId ?? null,
    eventName: input.eventName,
    eventDate: input.eventDate,
    status: input.status,
    notes: input.notes ?? '',
    issues: input.issues ?? '',
    bringNextTime: input.bringNextTime ?? '',
    missedOpportunities: input.missedOpportunities ?? '',
    topSellers: input.topSellers ?? '',
    crowdRating: input.crowdRating ?? null,
    weatherSummary: input.weatherSummary ?? null,
    weatherHighF: input.weatherHighF ?? null,
    weatherLowF: input.weatherLowF ?? null,
    weatherPrecipPct: input.weatherPrecipPct ?? null,
    weatherCondition: input.weatherCondition ?? null,
    checklistJson: serializeChecklist(input.checklist ?? buildDefaultChecklist()),
    grossSalesCents: dollarsToCents(input.grossSales) ?? null,
    expensesCents: dollarsToCents(input.expenses) ?? null,
    netProfitCents: dollarsToCents(input.netProfit) ?? null,
    marginBps: input.margin != null ? input.margin * 100 : null,
    breakEvenHour: input.breakEvenHour ?? null,
    bestHour: input.bestHour ?? null,
    cashPercent: input.cashPercent ?? null,
    cardPercent: input.cardPercent ?? null,
    financialId: input.financialId ?? null,
  };
}

export async function ensureDebriefDbSeed() {
  if (dbSeeded) return;
  const count = await prisma.eventDebrief.count();
  if (count === 0) {
    const passport = await prisma.vendorPassport.findUnique({
      where: { vendorEmail: DEMO_VENDOR_EMAIL },
      select: { id: true },
    });
    const seed = buildSeedEventDebriefs();
    for (const item of seed) {
      await prisma.eventDebrief.create({
        data: {
          id: item.id,
          ...inputToData(item.vendorEmail, item, passport?.id),
        },
      });
    }
  }
  dbSeeded = true;
}

export async function listDebriefsDb(vendorEmail: string): Promise<EventDebriefRecord[]> {
  const rows = await prisma.eventDebrief.findMany({
    where: { vendorEmail },
    orderBy: { eventDate: 'desc' },
  });
  return rows.map(rowToRecord);
}

export async function getDebriefDb(id: string): Promise<EventDebriefRecord | null> {
  const row = await prisma.eventDebrief.findUnique({ where: { id } });
  return row ? rowToRecord(row) : null;
}

export async function upsertDebriefDb(
  vendorEmail: string,
  input: EventDebriefInput
): Promise<EventDebriefRecord> {
  const passport = await prisma.vendorPassport.findUnique({
    where: { vendorEmail },
    select: { id: true },
  });
  const data = inputToData(vendorEmail, input, passport?.id);

  const row = await prisma.eventDebrief.upsert({
    where: {
      vendorEmail_eventName_eventDate: {
        vendorEmail,
        eventName: input.eventName,
        eventDate: input.eventDate,
      },
    },
    create: { id: input.id ?? `deb-${Date.now()}`, ...data },
    update: data,
  });
  return rowToRecord(row);
}

export async function deleteDebriefDb(id: string): Promise<boolean> {
  try {
    await prisma.eventDebrief.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
