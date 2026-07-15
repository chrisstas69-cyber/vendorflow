import { ensurePaymentSeed } from '@/lib/payments/seed';
import { seedLongIslandComplianceRules } from '@/lib/long-island/seed';
import { ensurePilotDbSeed } from '@/lib/pilot-db-seed';
import { ensureGalleryDbSeed } from '@/lib/gallery-db-store';
import { ensureGallerySeedStore } from '@/lib/gallery-seed-store';
import { ensureOpsContactsDbSeed } from '@/lib/ops-contacts-db-store';
import { ensureOpsContactsSeedStore } from '@/lib/ops-contacts-seed-store';
import { getPilotDataSource, setEffectiveDataSource } from '@/lib/pilot-config';
import { isHostedDatabaseUrl, prisma } from '@/lib/prisma';
import { resetDbStatusCache } from '@/lib/db-status';

let seeded = false;
let prismaAvailable: boolean | null = null;

/** Hosted Postgres (Neon) — SQLite file URLs fail on Vercel serverless */
async function canUsePrisma(): Promise<boolean> {
  if (prismaAvailable !== null) return prismaAvailable;
  const url = process.env.DATABASE_URL ?? '';
  if (!isHostedDatabaseUrl(url)) {
    prismaAvailable = false;
    return false;
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    prismaAvailable = true;
  } catch (err) {
    console.warn('[platform-seed] Postgres unreachable:', err instanceof Error ? err.message : err);
    prismaAvailable = false;
  }
  resetDbStatusCache();
  return prismaAvailable;
}

export async function ensurePlatformSeed() {
  if (seeded) return;

  const useDb = getPilotDataSource() === 'db' && (await canUsePrisma());
  setEffectiveDataSource(useDb ? 'db' : 'seed');

  if (useDb) {
    try {
      // Fast path: once an organizer account exists the DB has been seeded —
      // one cheap query instead of five per-store existence checks per cold start.
      const alreadySeeded = await prisma.organizerAccount
        .findFirst({ select: { id: true } })
        .then(Boolean)
        .catch(() => false);
      if (!alreadySeeded) {
        await ensurePaymentSeed();
        await seedLongIslandComplianceRules();
        await ensurePilotDbSeed();
        await ensureGalleryDbSeed();
        await ensureOpsContactsDbSeed();
      }
    } catch (err) {
      console.warn('[platform-seed] DB seed failed, falling back to in-memory seed:', err);
      setEffectiveDataSource('seed');
      ensureGallerySeedStore();
      ensureOpsContactsSeedStore();
    }
  } else {
    // Seed / demo mode — never touch Prisma when DATABASE_URL is missing/invalid
    ensureGallerySeedStore();
    ensureOpsContactsSeedStore();
  }

  seeded = true;
}
