import { getEffectiveDataSource } from '@/lib/pilot-config';
import type { VendorFinancialInput, VendorFinancialRecord } from '@/lib/vendor-financial-schema';
import {
  listFinancialsDb,
  seedDemoFinancialsIfEmpty,
  upsertFinancialDb,
} from '@/lib/vendor-financial-db-store';
import { listFinancialsSeed, upsertFinancialSeed } from '@/lib/vendor-financial-seed-store';

export async function listVendorFinancials(
  vendorEmail: string
): Promise<{ items: VendorFinancialRecord[]; dataSource: 'seed' | 'db' }> {
  if (getEffectiveDataSource() === 'db') {
    await seedDemoFinancialsIfEmpty();
    return { items: await listFinancialsDb(vendorEmail), dataSource: 'db' };
  }
  return { items: listFinancialsSeed(vendorEmail), dataSource: 'seed' };
}

export async function upsertVendorFinancial(
  vendorEmail: string,
  input: VendorFinancialInput
): Promise<VendorFinancialRecord> {
  if (getEffectiveDataSource() === 'db') {
    return upsertFinancialDb(vendorEmail, input);
  }
  return upsertFinancialSeed(vendorEmail, input);
}
