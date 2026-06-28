import type { OrgType } from '@/lib/ops-contacts-schema';

/** Source-of-truth priority — higher wins on dedupe conflicts */
export const SOURCE_PRIORITY = {
  manual: 100,
  human_edited: 90,
  tracker: 50,
  legacy: 40,
} as const;

export type SourceSystem = keyof typeof SOURCE_PRIORITY | 'human_edited';

export interface OrgIdentityInput {
  name: string;
  website?: string;
  orgType: OrgType;
  county?: string;
  town?: string;
}

export interface OrgIdentity extends OrgIdentityInput {
  canonicalName: string;
  normalizedDomain: string | null;
  dedupeKey: string;
}

const CHAMBER_SUFFIXES = [
  ' chamber of commerce',
  ' chamber',
  ' co c',
  ' c of c',
];

/** Normalize organization name for matching */
export function normalizeOrgName(name: string): string {
  let n = name.toLowerCase().trim();
  for (const suffix of CHAMBER_SUFFIXES) {
    if (n.endsWith(suffix)) {
      n = n.slice(0, -suffix.length).trim();
    }
  }
  return n.replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Extract hostname from URL — strips www. */
export function normalizeDomain(url?: string | null): string | null {
  if (!url?.trim()) return null;
  try {
    const withProto = url.includes('://') ? url : `https://${url}`;
    const host = new URL(withProto).hostname.toLowerCase();
    return host.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function buildOrgIdentity(input: OrgIdentityInput): OrgIdentity {
  const canonicalName = input.name.trim();
  const normalizedDomain = normalizeDomain(input.website);
  const county = input.county?.toLowerCase().replace(/\s+county$/i, '').trim() || undefined;
  const town = input.town?.trim() || undefined;

  let dedupeKey: string;
  if (normalizedDomain) {
    dedupeKey = `domain:${normalizedDomain}`;
  } else {
    const nameKey = normalizeOrgName(canonicalName);
    dedupeKey = `name:${nameKey}|${county ?? ''}|${town ?? ''}|${input.orgType}`;
  }

  return {
    ...input,
    canonicalName,
    normalizedDomain,
    county,
    town,
    dedupeKey,
  };
}

export function sourcePriorityFor(system: SourceSystem, manuallyEdited = false): number {
  if (manuallyEdited) return SOURCE_PRIORITY.human_edited;
  return SOURCE_PRIORITY[system as keyof typeof SOURCE_PRIORITY] ?? 40;
}
