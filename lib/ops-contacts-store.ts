import { getPilotDataSource } from '@/lib/pilot-config';
import type {
  OpsContactsSearchParams,
  OpsOrganizationRecord,
  ViewerRole,
} from '@/lib/ops-contacts-schema';
import {
  addOutreachActivitySeed,
  ensureOpsContactsSeedStore,
  getOrganizationSeed,
  listJurisdictionsSeed,
  searchOrganizationsSeed,
  updateContactSeed,
  updateOrganizationSeed,
} from '@/lib/ops-contacts-seed-store';
import {
  addOutreachActivityDb,
  ensureOpsContactsDbSeed,
  getOrganizationDb,
  listJurisdictionsDb,
  searchOrganizationsDb,
  updateOrganizationDb,
} from '@/lib/ops-contacts-db-store';

export async function searchOpsOrganizations(
  params: OpsContactsSearchParams,
  viewer: ViewerRole
): Promise<{ organizations: OpsOrganizationRecord[]; dataSource: 'seed' | 'db' }> {
  if (getPilotDataSource() === 'db') {
    await ensureOpsContactsDbSeed();
    const organizations = await searchOrganizationsDb(params, viewer);
    return { organizations, dataSource: 'db' };
  }
  ensureOpsContactsSeedStore();
  return { organizations: searchOrganizationsSeed(params, viewer), dataSource: 'seed' };
}

export async function getOpsOrganization(id: string, viewer: ViewerRole) {
  if (getPilotDataSource() === 'db') {
    await ensureOpsContactsDbSeed();
    return getOrganizationDb(id, viewer);
  }
  ensureOpsContactsSeedStore();
  return getOrganizationSeed(id, viewer);
}

export async function listOpsJurisdictions() {
  if (getPilotDataSource() === 'db') {
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
  if (getPilotDataSource() === 'db') {
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
  if (getPilotDataSource() === 'db') {
    return addOutreachActivityDb(input);
  }
  return addOutreachActivitySeed(input);
}

export async function updateOpsContact(
  id: string,
  patch: Parameters<typeof updateContactSeed>[1]
) {
  if (getPilotDataSource() === 'db') {
    // simplified — seed path for pilot edits in db mode can extend later
    return updateContactSeed(id, patch);
  }
  return updateContactSeed(id, patch);
}
