/**
 * One-time / idempotent bootstrap for Neon Postgres (hosted DB mode).
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." DIRECT_URL="postgresql://..." \
 *   PILOT_DATA_SOURCE=db npx tsx scripts/seed-hosted-db.ts
 *
 * Or after Vercel env is set, run locally against the production Neon branch.
 */
import { ensurePaymentSeed } from '@/lib/payments/seed';
import { seedLongIslandComplianceRules } from '@/lib/long-island/seed';
import { ensurePilotDbSeed } from '@/lib/pilot-db-seed';
import { ensureGalleryDbSeed } from '@/lib/gallery-db-store';
import { ensureOpsContactsDbSeed } from '@/lib/ops-contacts-db-store';
import { runChamberImportDb } from '@/lib/ops-contacts-db-store';
import { isHostedDatabaseUrl, prisma } from '@/lib/prisma';

async function main() {
  const url = process.env.DATABASE_URL ?? '';
  if (!isHostedDatabaseUrl(url)) {
    console.error('DATABASE_URL must be a hosted Postgres URL (Neon recommended).');
    process.exit(1);
  }

  if (process.env.PILOT_DATA_SOURCE !== 'db') {
    console.warn('PILOT_DATA_SOURCE is not "db" — continuing anyway for bootstrap.');
  }

  console.log('Probing Postgres…');
  await prisma.$queryRaw`SELECT 1`;
  console.log('Connected.');

  console.log('Seeding payments…');
  await ensurePaymentSeed();

  console.log('Seeding compliance rules…');
  await seedLongIslandComplianceRules();

  console.log('Seeding pilot organizer, applications, booths, activity…');
  await ensurePilotDbSeed();

  console.log('Seeding galleries…');
  await ensureGalleryDbSeed();

  console.log('Seeding ops contacts (jurisdictions + chambers)…');
  await ensureOpsContactsDbSeed();

  console.log('Running chamber CSV import (commit)…');
  const run = await runChamberImportDb({
    dryRun: false,
    actorLabel: 'seed-hosted-db script',
  });

  console.log('\nBootstrap complete.');
  console.log(
    `Import: processed=${run.rowsProcessed} created=${run.createdCount} updated=${run.updatedCount} skipped=${run.skippedCount}`
  );

  const counts = {
    organizers: await prisma.organizerAccount.count(),
    applications: await prisma.vendorApplication.count(),
    boothMaps: await prisma.boothMap.count(),
    opsOrgs: await prisma.opsOrganization.count(),
    importRuns: await prisma.importRun.count(),
  };
  console.log('Counts:', counts);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
