import { ensurePaymentSeed } from '@/lib/payments/seed';
import { seedLongIslandComplianceRules } from '@/lib/long-island/seed';

let seeded = false;

export async function ensurePlatformSeed() {
  if (seeded) return;
  await ensurePaymentSeed();
  await seedLongIslandComplianceRules();
  seeded = true;
}
