import { getEffectiveDataSource } from '@/lib/pilot-config';
import type {
  ImportRunSummary,
  OpsContactsSearchParams,
  OpsOrganizationRecord,
  ScrapeSourceHealthRecord,
  ViewerRole,
} from '@/lib/ops-contacts-schema';
import {
  addOutreachActivitySeed,
  ensureOpsContactsSeedStore,
  getOrganizationSeed,
  listChamberImportRunsSeed,
  listJurisdictionsSeed,
  runChamberImportSeed,
  searchOrganizationsSeed,
  updateContactSeed,
  updateOrganizationSeed,
} from '@/lib/ops-contacts-seed-store';
import {
  addOutreachActivityDb,
  ensureOpsContactsDbSeed,
  getOrganizationDb,
  listImportRunsDb,
  listJurisdictionsDb,
  runChamberImportDb,
  searchOrganizationsDb,
  updateContactDb,
  updateOrganizationDb,
} from '@/lib/ops-contacts-db-store';
import { getSourceHealthSnapshot, chamberCsvFreshness } from '@/lib/import/source-health';

export async function searchOpsOrganizations(
  params: OpsContactsSearchParams,
  viewer: ViewerRole
): Promise<{ organizations: OpsOrganizationRecord[]; dataSource: 'seed' | 'db' }> {
  if (getEffectiveDataSource() === 'db') {
    await ensureOpsContactsDbSeed();
    const organizations = await searchOrganizationsDb(params, viewer);
    return { organizations, dataSource: 'db' };
  }
  ensureOpsContactsSeedStore();
  return { organizations: searchOrganizationsSeed(params, viewer), dataSource: 'seed' };
}

export async function getOpsOrganization(id: string, viewer: ViewerRole) {
  if (getEffectiveDataSource() === 'db') {
    await ensureOpsContactsDbSeed();
    return getOrganizationDb(id, viewer);
  }
  ensureOpsContactsSeedStore();
  return getOrganizationSeed(id, viewer);
}

export async function listOpsJurisdictions() {
  if (getEffectiveDataSource() === 'db') {
    await ensureOpsContactsDbSeed();
    return listJurisdictionsDb();
  }
  ensureOpsContactsSeedStore();
  return listJurisdictionsSeed();
}

export async function updateOpsOrganization(
  id: string,
  patch: Partial<Pick<OpsOrganizationRecord, 'outreachStatus' | 'notes' | 'internalOnly' | 'defaultVisibility'>>
) {
  if (getEffectiveDataSource() === 'db') {
    return updateOrganizationDb(id, patch);
  }
  return updateOrganizationSeed(id, patch);
}

export async function logOpsOutreach(input: {
  organizationId: string;
  contactId?: string;
  activityType: string;
  summary: string;
  actorLabel?: string;
}) {
  if (getEffectiveDataSource() === 'db') {
    return addOutreachActivityDb(input);
  }
  return addOutreachActivitySeed(input);
}

export async function updateOpsContact(
  id: string,
  patch: Parameters<typeof updateContactSeed>[1]
) {
  if (getEffectiveDataSource() === 'db') {
    return updateContactDb(id, patch);
  }
  return updateContactSeed(id, patch);
}

export async function runChamberImport(input: {
  dryRun: boolean;
  filePath?: string;
  actorLabel?: string;
  forceOverwriteManual?: boolean;
}): Promise<{ run: ImportRunSummary; dataSource: 'seed' | 'db' }> {
  if (getEffectiveDataSource() === 'db') {
    const run = await runChamberImportDb(input);
    return { run, dataSource: 'db' };
  }
  const run = runChamberImportSeed(input);
  return { run, dataSource: 'seed' };
}

export async function listChamberImportRuns(limit = 20): Promise<ImportRunSummary[]> {
  if (getEffectiveDataSource() === 'db') {
    return listImportRunsDb(limit);
  }
  return listChamberImportRunsSeed(limit);
}

export async function getOpsSourceHealth(): Promise<{
  sources: ScrapeSourceHealthRecord[];
  chamberCsv: ReturnType<typeof chamberCsvFreshness>;
}> {
  return {
    sources: getSourceHealthSnapshot(),
    chamberCsv: chamberCsvFreshness(),
  };
}
