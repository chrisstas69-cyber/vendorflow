import type { FinancialRecord } from '@/lib/mock-data';

export interface VendorFinancialRecord {
  id: string;
  vendorEmail: string;
  eventId?: string;
  eventName: string;
  eventDate: string;
  grossSales: number;
  expenses: number;
  netProfit: number;
  margin: number;
  breakEvenHour?: string;
  bestHour?: string;
  cashPercent?: number;
  cardPercent?: number;
  source: 'import' | 'quick-log';
  createdAt: string;
  updatedAt: string;
}

export type VendorFinancialInput = Omit<
  VendorFinancialRecord,
  'id' | 'createdAt' | 'updatedAt' | 'vendorEmail'
> & { id?: string };

export function financialFromRecord(r: FinancialRecord, source: 'import' | 'quick-log' = 'import'): VendorFinancialInput {
  return {
    eventId: r.eventId,
    eventName: r.eventName,
    eventDate: r.date,
    grossSales: r.grossSales,
    expenses: r.expenses,
    netProfit: r.netProfit,
    margin: r.margin,
    breakEvenHour: r.breakEvenHour,
    bestHour: r.bestHour,
    cashPercent: r.cashPercent,
    cardPercent: r.cardPercent,
    source,
  };
}

export function recordFromFinancial(f: VendorFinancialRecord): FinancialRecord {
  return {
    id: f.id,
    eventId: f.eventId,
    eventName: f.eventName,
    date: f.eventDate,
    grossSales: f.grossSales,
    expenses: f.expenses,
    netProfit: f.netProfit,
    margin: f.margin,
    breakEvenHour: f.breakEvenHour ?? '—',
    bestHour: f.bestHour ?? '—',
    cashPercent: f.cashPercent ?? 50,
    cardPercent: f.cardPercent ?? 50,
  };
}

export function dollarsToCents(n: number) {
  return Math.round(n * 100);
}

export function centsToDollars(c: number) {
  return c / 100;
}
