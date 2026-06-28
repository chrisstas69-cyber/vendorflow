import { ensurePaymentSeed } from '@/lib/payments/seed';
import { seedLongIslandComplianceRules } from '@/lib/long-island/seed';
import { ensurePilotDbSeed } from '@/lib/pilot-db-seed';
import { ensureGalleryDbSeed } from '@/lib/gallery-db-store';
import { ensureGallerySeedStore } from '@/lib/gallery-seed-store';
import { ensureOpsContactsDbSeed } from '@/lib/ops-contacts-db-store';
import { ensureOpsContactsSeedStore } from '@/lib/ops-contacts-seed-store';
import { getPilotDataSource } from '@/lib/pilot-config';

let seeded = false;

export async function ensurePlatformSeed() {
  if (seeded) return;
  await ensurePaymentSeed();
  await seedLongIslandComplianceRules();
  if (getPilotDataSource() === 'db') {
    await ensurePilotDbSeed();
    await ensureGalleryDbSeed();
    await ensureOpsContactsDbSeed();
  } else {
    ensureGallerySeedStore();
    ensureOpsContactsSeedStore();
  }
  seeded = true;
}
