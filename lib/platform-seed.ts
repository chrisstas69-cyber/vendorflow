import { ensurePaymentSeed } from '@/lib/payments/seed';
import { seedLongIslandComplianceRules } from '@/lib/long-island/seed';
import { ensurePilotDbSeed } from '@/lib/pilot-db-seed';
import { ensureGalleryDbSeed } from '@/lib/gallery-db-store';
import { ensureGallerySeedStore } from '@/lib/gallery-seed-store';
import { ensureOpsContactsDbSeed } from '@/lib/ops-contacts-db-store';
import { ensureOpsContactsSeedStore } from '@/lib/ops-contacts-seed-store';
import { getPilotDataSource } from '@/lib/pilot-config';

let seeded = false;
let prismaAvailable: boolean | null = null;

/** Prisma + SQLite file URLs fail on Vercel serverless — detect once and fall back to seed stores */
async function canUsePrisma(): Promise<boolean> {
  if (prismaAvailable !== null) return prismaAvailable;
  const url = process.env.DATABASE_URL ?? '';
  if (!url || url.startsWith('file:')) {
    prismaAvailable = false;
    return false;
  }
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
    prismaAvailable = true;
  } catch {
    prismaAvailable = false;
  }
  return prismaAvailable;
}

export async function ensurePlatformSeed() {
  if (seeded) return;

  const useDb = getPilotDataSource() === 'db' && (await canUsePrisma());

  if (useDb) {
    try {
      await ensurePaymentSeed();
      await seedLongIslandComplianceRules();
      await ensurePilotDbSeed();
      await ensureGalleryDbSeed();
      await ensureOpsContactsDbSeed();
    } catch (err) {
      console.warn('[platform-seed] DB seed failed, falling back to in-memory seed:', err);
      ensureGallerySeedStore();
      ensureOpsContactsSeedStore();
    }
  } else {
    try {
      await ensurePaymentSeed();
      await seedLongIslandComplianceRules();
    } catch (err) {
      console.warn('[platform-seed] Prisma optional seed skipped:', err);
    }
    ensureGallerySeedStore();
    ensureOpsContactsSeedStore();
  }

  seeded = true;
}
