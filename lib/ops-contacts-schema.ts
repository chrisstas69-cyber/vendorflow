/** Private operational contact database — NOT a public directory */

export const ORG_TYPES = [
  'chamber',
  'bid',
  'town-office',
  'village-office',
  'parks-rec',
  'market-operator',
  'festival-organizer',
  'venue-operator',
  'fire-department',
  'fire-marshal',
  'health-department',
  'permitting-office',
  'police-public-safety',
  'sanitation-dpw',
  'nonprofit-school-church',
] as const;

export type OrgType = (typeof ORG_TYPES)[number];

export const CONTACT_PURPOSE_TAGS = [
  'permits',
  'food',
  'fire',
  'logistics',
  'event-day',
  'payments',
  'vendor-applications',
  'road-closures',
  'sanitation',
  'public-safety',
  'venue-coordination',
  'general',
] as const;

export type ContactPurposeTag = (typeof CONTACT_PURPOSE_TAGS)[number];

export const OUTREACH_STATUSES = [
  'lead',
  'researching',
  'contacted',
  'meeting-booked',
  'pilot-candidate',
  'active',
] as const;

export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

export const VISIBILITY_LEVELS = [
  'internal',
  'organizer-only',
  'approved-vendor',
  'all-paying-clients',
] as const;

export type VisibilityLevel = (typeof VISIBILITY_LEVELS)[number];

export type ViewerRole = 'internal' | 'organizer' | 'approved-vendor' | 'paying-client';

export interface JurisdictionRecord {
  id: string;
  name: string;
  slug: string;
  county?: string;
  town?: string;
  region: string;
  state: string;
}

export interface OpsContactRecord {
  id: string;
  organizationId: string;
  name: string;
  title?: string;
  phone?: string;
  email?: string;
  linkedIn?: string;
  department?: string;
  preferredContactMethod: 'email' | 'phone' | 'linkedin';
  purposeTags: ContactPurposeTag[];
  visibility: VisibilityLevel;
  notes: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationEventProfileRecord {
  id: string;
  organizationId: string;
  eventDistrict?: string;
  eventTypes: string[];
  seasonality?: string;
  typicalVendorCount?: number;
  notes: string;
}

export interface OutreachActivityRecord {
  id: string;
  organizationId?: string;
  contactId?: string;
  activityType: string;
  summary: string;
  actorLabel?: string;
  createdAt: string;
}

/** Import metadata — internal intelligence layer */
export interface OpsImportMetadata {
  canonicalName?: string;
  normalizedDomain?: string | null;
  dedupeKey?: string;
  county?: string;
  town?: string;
  sourceSystem?: 'manual' | 'tracker' | 'legacy';
  sourceFile?: string;
  sourceUrl?: string;
  sourcePriority?: number;
  lastImportedAt?: string;
  lastSeenAt?: string;
  importRunId?: string;
  manuallyEdited?: boolean;
}

export type ImportRowAction = 'create' | 'update' | 'skip' | 'conflict' | 'error';

export interface ImportRowResult {
  rowIndex: number;
  chamberName: string;
  dedupeKey: string;
  action: ImportRowAction;
  existingId?: string;
  reason: string;
  changedFields?: string[];
}

export interface ImportRunSummary {
  id: string;
  createdAt: string;
  sourceSystem: string;
  sourceFile?: string;
  dryRun: boolean;
  status: 'preview' | 'completed' | 'failed';
  rowsProcessed: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  conflictCount: number;
  errorCount: number;
  rows: ImportRowResult[];
  actorLabel?: string;
}

export interface ScrapeSourceHealthRecord {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'degraded' | 'unknown';
  active: boolean;
  lastCheckedAt?: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  lastError?: string;
  outputCount?: number;
  region?: string;
  category?: string;
}

export interface OpsOrganizationRecord {
  id: string;
  type: OrgType;
  name: string;
  website?: string;
  publicPhone?: string;
  publicEmail?: string;
  address?: string;
  jurisdictionId?: string;
  jurisdiction?: JurisdictionRecord;
  jurisdictionCoverage: string[];
  notes: string;
  recurringEventTypes: string[];
  vendorHeavy: boolean;
  fitScore: number;
  internalOnly: boolean;
  outreachStatus: OutreachStatus;
  defaultVisibility: VisibilityLevel;
  contacts: OpsContactRecord[];
  eventProfiles: OrganizationEventProfileRecord[];
  outreachActivities: OutreachActivityRecord[];
  createdAt: string;
  updatedAt: string;
  import?: OpsImportMetadata;
}

export interface OpsContactsSearchParams {
  q?: string;
  county?: string;
  town?: string;
  orgType?: OrgType;
  department?: string;
  purposeTag?: ContactPurposeTag;
  outreachStatus?: OutreachStatus;
  visibility?: VisibilityLevel;
  internalOnly?: boolean;
}

export const ORG_TYPE_LABELS: Record<OrgType, string> = {
  chamber: 'Chamber of Commerce',
  bid: 'BID / Downtown Association',
  'town-office': 'Town Office',
  'village-office': 'Village Office',
  'parks-rec': 'Parks & Recreation',
  'market-operator': 'Market Operator',
  'festival-organizer': 'Festival Organizer',
  'venue-operator': 'Venue Operator',
  'fire-department': 'Fire Department',
  'fire-marshal': 'Fire Marshal',
  'health-department': 'Health Department',
  'permitting-office': 'Permitting Office',
  'police-public-safety': 'Police / Public Safety',
  'sanitation-dpw': 'Sanitation / DPW',
  'nonprofit-school-church': 'Nonprofit / School / Church',
};

export const PURPOSE_TAG_LABELS: Record<ContactPurposeTag, string> = {
  permits: 'Permits',
  food: 'Food / Health',
  fire: 'Fire safety',
  logistics: 'Logistics',
  'event-day': 'Event day',
  payments: 'Payments',
  'vendor-applications': 'Vendor applications',
  'road-closures': 'Road closures',
  sanitation: 'Sanitation',
  'public-safety': 'Public safety',
  'venue-coordination': 'Venue coordination',
  general: 'General',
};

export const OUTREACH_STATUS_LABELS: Record<OutreachStatus, string> = {
  lead: 'Lead',
  researching: 'Researching',
  contacted: 'Contacted',
  'meeting-booked': 'Meeting booked',
  'pilot-candidate': 'Pilot candidate',
  active: 'Active client',
};

export const VISIBILITY_LABELS: Record<VisibilityLevel, string> = {
  internal: 'Internal only',
  'organizer-only': 'Organizer (paying)',
  'approved-vendor': 'Approved vendors',
  'all-paying-clients': 'All paying clients',
};

export function parseJsonArray(raw: string | unknown): string[] {
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw || '[]') : raw;
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

export function parsePurposeTags(raw: string | unknown): ContactPurposeTag[] {
  return parseJsonArray(raw).filter((t): t is ContactPurposeTag =>
    CONTACT_PURPOSE_TAGS.includes(t as ContactPurposeTag)
  );
}

/** Visibility hierarchy — higher index = more public */
const VISIBILITY_RANK: Record<VisibilityLevel, number> = {
  internal: 0,
  'organizer-only': 1,
  'approved-vendor': 2,
  'all-paying-clients': 3,
};

const VIEWER_MAX_RANK: Record<ViewerRole, number> = {
  internal: 3,
  organizer: 1,
  'approved-vendor': 2,
  'paying-client': 3,
};

export function canViewAtLevel(
  visibility: VisibilityLevel,
  viewer: ViewerRole,
  orgInternalOnly?: boolean
): boolean {
  if (orgInternalOnly && viewer !== 'internal') return false;
  return VISIBILITY_RANK[visibility] <= VIEWER_MAX_RANK[viewer];
}

export function filterOrganizationForViewer(
  org: OpsOrganizationRecord,
  viewer: ViewerRole
): OpsOrganizationRecord | null {
  if (org.internalOnly && viewer !== 'internal') return null;
  const contacts = org.contacts.filter(c => canViewAtLevel(c.visibility, viewer, org.internalOnly));
  if (contacts.length === 0 && viewer !== 'internal') {
    // Still show org shell if default visibility allows and has public phone/email
    if (!canViewAtLevel(org.defaultVisibility, viewer, org.internalOnly)) return null;
  }
  return {
    ...org,
    contacts,
    outreachActivities: viewer === 'internal' ? org.outreachActivities : [],
    notes: viewer === 'internal' ? org.notes : org.notes.replace(/\[internal\][\s\S]*?\[\/internal\]/g, '').trim(),
  };
}

export function resolveViewerRole(input?: string | null): ViewerRole {
  if (input === 'internal') return 'internal';
  if (input === 'approved-vendor') return 'approved-vendor';
  if (input === 'paying-client') return 'paying-client';
  return 'organizer';
}
