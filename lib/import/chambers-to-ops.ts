import type { OpsOrganizationRecord } from '@/lib/ops-contacts-schema';
import { buildOrgIdentity, sourcePriorityFor } from '@/lib/import/identity';
import {
  countyToRegion,
  loadChamberListFromFile,
  type ChamberListRecord,
} from '@/lib/import/chamber-list';
import { mergeOpsOrganizationsByIdentity } from '@/lib/import/merge-orgs';

const now = new Date().toISOString();

function chamberToOpsOrg(ch: ChamberListRecord): OpsOrganizationRecord {
  const county = ch.county || 'unknown';
  const region = countyToRegion(county);
  const identity = buildOrgIdentity({
    name: ch.name,
    website: ch.url,
    orgType: 'chamber',
    county: ch.county,
    town: ch.town,
  });

  return {
    id: ch.id,
    type: 'chamber',
    name: ch.name,
    website: ch.url,
    publicEmail: undefined,
    publicPhone: undefined,
    address: ch.town ? `${ch.town}, ${ch.county} County, NY` : undefined,
    jurisdictionId: region === 'nassau' ? 'jur-nassau' : region === 'suffolk' ? 'jur-suffolk' : undefined,
    jurisdiction:
      region === 'nassau'
        ? {
            id: 'jur-nassau',
            name: 'Nassau County',
            slug: 'nassau-county',
            county: 'nassau',
            region: 'long-island',
            state: 'NY',
          }
        : region === 'suffolk'
          ? {
              id: 'jur-suffolk',
              name: 'Suffolk County',
              slug: 'suffolk-county',
              county: 'suffolk',
              region: 'long-island',
              state: 'NY',
            }
          : undefined,
    jurisdictionCoverage: ch.town ? [ch.town] : [],
    notes: [
      ch.notes,
      ch.eventsUrl !== ch.url ? `Events/calendar: ${ch.eventsUrl}` : undefined,
      `Imported from ${ch.sourceFile ?? 'chamber_list.csv'} (${ch.source})`,
    ]
      .filter(Boolean)
      .join(' · '),
    recurringEventTypes: ['street-fair', 'farmers-market', 'community-event'],
    vendorHeavy: true,
    fitScore: Math.min(90, 55 + (ch.status === 'active' ? 20 : 0) + (ch.eventsUrl !== ch.url ? 10 : 0)),
    internalOnly: false,
    outreachStatus: ch.status === 'active' ? 'contacted' : 'lead',
    defaultVisibility: 'organizer-only',
    contacts: [
      {
        id: `${ch.id}-web`,
        organizationId: ch.id,
        name: `${ch.town || ch.name} — website`,
        title: 'Chamber website',
        email: undefined,
        phone: undefined,
        preferredContactMethod: 'email',
        purposeTags: ['vendor-applications', 'general'],
        visibility: 'organizer-only',
        notes: `Primary site: ${ch.url}`,
        createdAt: now,
        updatedAt: now,
      },
    ],
    eventProfiles: ch.town
      ? [
          {
            id: `${ch.id}-ep`,
            organizationId: ch.id,
            eventDistrict: ch.town,
            eventTypes: ['street-fair', 'farmers-market'],
            notes: `Scrape target: ${ch.eventsUrl}`,
          },
        ]
      : [],
    outreachActivities: [],
    createdAt: now,
    updatedAt: now,
    import: {
      canonicalName: identity.canonicalName,
      normalizedDomain: identity.normalizedDomain,
      dedupeKey: identity.dedupeKey,
      county: identity.county,
      town: identity.town,
      sourceSystem: ch.source,
      sourceFile: ch.sourceFile ?? 'data/chamber_list.csv',
      sourceUrl: ch.url,
      sourcePriority: sourcePriorityFor(ch.source),
      lastImportedAt: now,
      lastSeenAt: ch.lastChecked ?? now,
      manuallyEdited: false,
    },
  };
}

/** Load ~174 chambers from data/chamber_list.csv into ops contact records */
export function loadChamberOpsOrganizations(filePath?: string): OpsOrganizationRecord[] {
  const chambers = loadChamberListFromFile(filePath);
  return chambers.map(ch => chamberToOpsOrg(ch));
}

export function mergeOpsOrganizations(
  manual: OpsOrganizationRecord[],
  fromCsv: OpsOrganizationRecord[]
): OpsOrganizationRecord[] {
  const manualWithMeta = manual.map(o => ({
    ...o,
    import: {
      ...o.import,
      sourceSystem: o.import?.sourceSystem ?? ('manual' as const),
      sourcePriority: o.import?.sourcePriority ?? sourcePriorityFor('manual', o.import?.manuallyEdited),
    },
  }));
  return mergeOpsOrganizationsByIdentity([
    { orgs: fromCsv, system: 'tracker' },
    { orgs: manualWithMeta, system: 'manual' },
  ]);
}

export { loadChamberListFromFile, chamberToOpsOrg };
