import type {
  OpsContactRecord,
  OpsContactsSearchParams,
  OpsOrganizationRecord,
  OutreachActivityRecord,
  ViewerRole,
} from '@/lib/ops-contacts-schema';
import {
  filterOrganizationForViewer,
  parseJsonArray,
  parsePurposeTags,
  resolveViewerRole,
} from '@/lib/ops-contacts-schema';
import { buildSeedOpsOrganizations, SEED_JURISDICTIONS } from '@/lib/ops-contacts-seed-data';

let organizations: OpsOrganizationRecord[] = [];

export function ensureOpsContactsSeedStore() {
  if (organizations.length === 0) {
    organizations = buildSeedOpsOrganizations();
  }
}

export function listJurisdictionsSeed() {
  ensureOpsContactsSeedStore();
  return SEED_JURISDICTIONS;
}

function matchesSearch(org: OpsOrganizationRecord, params: OpsContactsSearchParams): boolean {
  const q = params.q?.toLowerCase().trim();
  if (q) {
    const hay = [
      org.name,
      org.notes,
      org.address ?? '',
      ...org.contacts.map(c => `${c.name} ${c.title ?? ''} ${c.email ?? ''} ${c.department ?? ''}`),
    ]
      .join(' ')
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (params.county && org.jurisdiction?.county !== params.county) return false;
  if (params.town && org.jurisdiction?.town !== params.town && !org.jurisdictionCoverage.includes(params.town))
    return false;
  if (params.orgType && org.type !== params.orgType) return false;
  if (params.outreachStatus && org.outreachStatus !== params.outreachStatus) return false;
  if (params.internalOnly !== undefined && org.internalOnly !== params.internalOnly) return false;
  if (params.department) {
    const hasDept = org.contacts.some(
      c => c.department?.toLowerCase().includes(params.department!.toLowerCase())
    );
    if (!hasDept) return false;
  }
  if (params.purposeTag) {
    const hasTag = org.contacts.some(c => c.purposeTags.includes(params.purposeTag!));
    if (!hasTag) return false;
  }
  if (params.visibility) {
    const hasVis =
      org.defaultVisibility === params.visibility ||
      org.contacts.some(c => c.visibility === params.visibility);
    if (!hasVis) return false;
  }
  return true;
}

export function searchOrganizationsSeed(
  params: OpsContactsSearchParams,
  viewer: ViewerRole
): OpsOrganizationRecord[] {
  ensureOpsContactsSeedStore();
  return organizations
    .filter(o => matchesSearch(o, params))
    .map(o => filterOrganizationForViewer(o, viewer))
    .filter((o): o is OpsOrganizationRecord => o !== null);
}

export function getOrganizationSeed(id: string, viewer: ViewerRole): OpsOrganizationRecord | null {
  ensureOpsContactsSeedStore();
  const org = organizations.find(o => o.id === id);
  if (!org) return null;
  return filterOrganizationForViewer(org, viewer);
}

export function updateOrganizationSeed(
  id: string,
  patch: Partial<
    Pick<
      OpsOrganizationRecord,
      'outreachStatus' | 'notes' | 'internalOnly' | 'defaultVisibility' | 'fitScore'
    >
  >
): OpsOrganizationRecord | null {
  ensureOpsContactsSeedStore();
  const idx = organizations.findIndex(o => o.id === id);
  if (idx < 0) return null;
  organizations[idx] = {
    ...organizations[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  return organizations[idx];
}

export function addOutreachActivitySeed(input: {
  organizationId: string;
  contactId?: string;
  activityType: string;
  summary: string;
  actorLabel?: string;
}): OutreachActivityRecord {
  ensureOpsContactsSeedStore();
  const activity: OutreachActivityRecord = {
    id: `oa-${Date.now()}`,
    organizationId: input.organizationId,
    contactId: input.contactId,
    activityType: input.activityType,
    summary: input.summary,
    actorLabel: input.actorLabel,
    createdAt: new Date().toISOString(),
  };
  const idx = organizations.findIndex(o => o.id === input.organizationId);
  if (idx >= 0) {
    organizations[idx].outreachActivities.unshift(activity);
  }
  return activity;
}

export function updateContactSeed(
  id: string,
  patch: Partial<Pick<OpsContactRecord, 'notes' | 'visibility' | 'phone' | 'email'>>
): OpsContactRecord | null {
  ensureOpsContactsSeedStore();
  for (const org of organizations) {
    const idx = org.contacts.findIndex(c => c.id === id);
    if (idx >= 0) {
      org.contacts[idx] = {
        ...org.contacts[idx],
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      return org.contacts[idx];
    }
  }
  return null;
}

export { parseJsonArray, parsePurposeTags, resolveViewerRole };
