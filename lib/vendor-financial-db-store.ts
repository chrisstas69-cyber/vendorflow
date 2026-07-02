import { prisma } from '@/lib/prisma';
import type { VendorFinancialInput, VendorFinancialRecord } from '@/lib/vendor-financial-schema';
import { centsToDollars, dollarsToCents } from '@/lib/vendor-financial-schema';
import { DEMO_VENDOR_EMAIL } from '@/lib/vendor-passport';

function rowToRecord(row: {
  id: string;
  vendorEmail: string;
  eventId: string | null;
  eventName: string;
  eventDate: string;
  grossSalesCents: number;
  expensesCents: number;
  netProfitCents: number;
  marginBps: number;
  breakEvenHour: string | null;
  bestHour: string | null;
  cashPercent: number | null;
  cardPercent: number | null;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}): VendorFinancialRecord {
  return {
    id: row.id,
    vendorEmail: row.vendorEmail,
    eventId: row.eventId ?? undefined,
    eventName: row.eventName,
    eventDate: row.eventDate,
    grossSales: centsToDollars(row.grossSalesCents),
    expenses: centsToDollars(row.expensesCents),
    netProfit: centsToDollars(row.netProfitCents),
    margin: Math.round(row.marginBps / 100),
    breakEvenHour: row.breakEvenHour ?? undefined,
    bestHour: row.bestHour ?? undefined,
    cashPercent: row.cashPercent ?? undefined,
    cardPercent: row.cardPercent ?? undefined,
    source: row.source as 'import' | 'quick-log',
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listFinancialsDb(vendorEmail: string): Promise<VendorFinancialRecord[]> {
  const rows = await prisma.vendorFinancial.findMany({
    where: { vendorEmail },
    orderBy: { eventDate: 'desc' },
    take: 500,
  });
  return rows.map(rowToRecord);
}

export async function upsertFinancialDb(
  vendorEmail: string,
  input: VendorFinancialInput
): Promise<VendorFinancialRecord> {
  const passport = await prisma.vendorPassport.findUnique({
    where: { vendorEmail },
    select: { id: true },
  });
  const data = {
    vendorEmail,
    vendorPassportId: passport?.id ?? null,
    eventId: input.eventId ?? null,
    eventName: input.eventName,
    eventDate: input.eventDate,
    grossSalesCents: dollarsToCents(input.grossSales),
    expensesCents: dollarsToCents(input.expenses),
    netProfitCents: dollarsToCents(input.netProfit),
    marginBps: input.margin * 100,
    breakEvenHour: input.breakEvenHour ?? null,
    bestHour: input.bestHour ?? null,
    cashPercent: input.cashPercent ?? null,
    cardPercent: input.cardPercent ?? null,
    source: input.source,
  };
  const row = await prisma.vendorFinancial.upsert({
    where: {
      vendorEmail_eventName_eventDate: {
        vendorEmail,
        eventName: input.eventName,
        eventDate: input.eventDate,
      },
    },
    create: { id: input.id ?? `fin-${Date.now()}`, ...data },
    update: data,
  });
  return rowToRecord(row);
}

export async function seedDemoFinancialsIfEmpty() {
  const count = await prisma.vendorFinancial.count({ where: { vendorEmail: DEMO_VENDOR_EMAIL } });
  if (count > 0) return;
  const samples = [
    { eventName: "Valentine's Day Fair", eventDate: '2026-02-14', gross: 1420, exp: 320, net: 1100, margin: 77 },
    { eventName: 'Super Bowl Sunday Bazaar', eventDate: '2026-02-01', gross: 890, exp: 275, net: 615, margin: 69 },
  ];
  for (const s of samples) {
    await upsertFinancialDb(DEMO_VENDOR_EMAIL, {
      eventName: s.eventName,
      eventDate: s.eventDate,
      grossSales: s.gross,
      expenses: s.exp,
      netProfit: s.net,
      margin: s.margin,
      breakEvenHour: '11:15 AM',
      bestHour: '1:30 PM',
      cashPercent: 45,
      cardPercent: 55,
      source: 'import',
    });
  }
}
