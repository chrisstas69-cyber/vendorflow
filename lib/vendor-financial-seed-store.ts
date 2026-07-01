import type { VendorFinancialInput, VendorFinancialRecord } from '@/lib/vendor-financial-schema';
import { DEMO_VENDOR_EMAIL } from '@/lib/vendor-passport';
import { mockFinancials } from '@/lib/mock-data';
import { recordFromFinancial, financialFromRecord } from '@/lib/vendor-financial-schema';

let records: VendorFinancialRecord[] = [];

function ensureSeed() {
  if (records.length === 0) {
    const now = new Date().toISOString();
    records = mockFinancials.map(f => ({
      id: f.id,
      vendorEmail: DEMO_VENDOR_EMAIL,
      ...financialFromRecord(f),
      createdAt: now,
      updatedAt: now,
    }));
  }
}

export function listFinancialsSeed(vendorEmail: string): VendorFinancialRecord[] {
  ensureSeed();
  return records.filter(r => r.vendorEmail === vendorEmail).sort((a, b) => b.eventDate.localeCompare(a.eventDate));
}

export function upsertFinancialSeed(vendorEmail: string, input: VendorFinancialInput): VendorFinancialRecord {
  ensureSeed();
  const now = new Date().toISOString();
  const idx = records.findIndex(
    r => r.vendorEmail === vendorEmail && r.eventName === input.eventName && r.eventDate === input.eventDate
  );
  const record: VendorFinancialRecord = {
    id: input.id ?? (idx >= 0 ? records[idx].id : `fin-${Date.now()}`),
    vendorEmail,
    ...input,
    createdAt: idx >= 0 ? records[idx].createdAt : now,
    updatedAt: now,
  };
  if (idx >= 0) records[idx] = record;
  else records.unshift(record);
  return record;
}

export { recordFromFinancial };
