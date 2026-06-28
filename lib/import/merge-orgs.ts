import type { OpsOrganizationRecord } from '@/lib/ops-contacts-schema';
import { buildOrgIdentity, sourcePriorityFor } from '@/lib/import/identity';

type MergeSourceSystem = 'manual' | 'tracker' | 'legacy';

/** Merge org lists using dedupe keys — higher sourcePriority wins */
export function mergeOpsOrganizationsByIdentity(
  sources: { orgs: OpsOrganizationRecord[]; system: MergeSourceSystem }[]
): OpsOrganizationRecord[] {
  const byKey = new Map<string, OpsOrganizationRecord>();

  for (const { orgs, system } of sources) {
    for (const org of orgs) {
      const identity = buildOrgIdentity({
        name: org.import?.canonicalName ?? org.name,
        website: org.website,
        orgType: org.type,
        county: org.import?.county ?? org.jurisdiction?.county,
        town: org.import?.town ?? org.jurisdictionCoverage[0] ?? org.jurisdiction?.town,
      });

      const enriched: OpsOrganizationRecord = {
        ...org,
        import: {
          ...org.import,
          canonicalName: identity.canonicalName,
          normalizedDomain: identity.normalizedDomain,
          dedupeKey: identity.dedupeKey,
          county: identity.county,
          town: identity.town,
          sourceSystem: org.import?.sourceSystem ?? system,
          sourcePriority:
            org.import?.sourcePriority ?? sourcePriorityFor(system, org.import?.manuallyEdited),
        },
      };

      const existing = byKey.get(identity.dedupeKey);
      if (!existing) {
        byKey.set(identity.dedupeKey, enriched);
        continue;
      }

      const existingPri = existing.import?.sourcePriority ?? 0;
      const incomingPri = enriched.import?.sourcePriority ?? 0;

      if (incomingPri > existingPri) {
        byKey.set(identity.dedupeKey, enriched);
      } else if (incomingPri === existingPri && system === 'manual') {
        byKey.set(identity.dedupeKey, enriched);
      }
    }
  }

  return Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function indexOrgsByDedupeKey(orgs: OpsOrganizationRecord[]): Map<string, OpsOrganizationRecord> {
  const map = new Map<string, OpsOrganizationRecord>();
  for (const org of orgs) {
    const key =
      org.import?.dedupeKey ??
      buildOrgIdentity({
        name: org.name,
        website: org.website,
        orgType: org.type,
        county: org.jurisdiction?.county,
        town: org.jurisdictionCoverage[0],
      }).dedupeKey;
    if (!map.has(key)) map.set(key, org);
  }
  return map;
}

/** Fields compared during import update detection */
export function diffOrgFields(
  existing: OpsOrganizationRecord,
  incoming: OpsOrganizationRecord
): string[] {
  const changed: string[] = [];
  if (existing.name !== incoming.name) changed.push('name');
  if ((existing.website ?? '') !== (incoming.website ?? '')) changed.push('website');
  if ((existing.address ?? '') !== (incoming.address ?? '')) changed.push('address');
  if (existing.outreachStatus !== incoming.outreachStatus) changed.push('outreachStatus');
  if (existing.notes !== incoming.notes) changed.push('notes');
  if (existing.fitScore !== incoming.fitScore) changed.push('fitScore');
  return changed;
}
