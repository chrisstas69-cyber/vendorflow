import { prisma } from '@/lib/prisma';
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
  type ContactPurposeTag,
  type OrgType,
  type OutreachStatus,
  type VisibilityLevel,
} from '@/lib/ops-contacts-schema';
import { buildSeedOpsOrganizations, SEED_JURISDICTIONS } from '@/lib/ops-contacts-seed-data';

let dbSeeded = false;

function mapContact(row: {
  id: string;
  organizationId: string;
  name: string;
  title: string | null;
  phone: string | null;
  email: string | null;
  linkedIn: string | null;
  department: string | null;
  preferredContactMethod: string;
  purposeTags: string;
  visibility: string;
  notes: string;
  internalNotes: string;
  createdAt: Date;
  updatedAt: Date;
}): OpsContactRecord {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    title: row.title ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    linkedIn: row.linkedIn ?? undefined,
    department: row.department ?? undefined,
    preferredContactMethod: row.preferredContactMethod as OpsContactRecord['preferredContactMethod'],
    purposeTags: parsePurposeTags(row.purposeTags),
    visibility: row.visibility as VisibilityLevel,
    notes: row.notes,
    internalNotes: row.internalNotes || undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapOrg(row: Awaited<ReturnType<typeof fetchOrgRows>>[0]): OpsOrganizationRecord {
  return {
    id: row.id,
    type: row.type as OrgType,
    name: row.name,
    website: row.website ?? undefined,
    publicPhone: row.publicPhone ?? undefined,
    publicEmail: row.publicEmail ?? undefined,
    address: row.address ?? undefined,
    jurisdictionId: row.jurisdictionId ?? undefined,
    jurisdiction: row.jurisdiction
      ? {
          id: row.jurisdiction.id,
          name: row.jurisdiction.name,
          slug: row.jurisdiction.slug,
          county: row.jurisdiction.county ?? undefined,
          town: row.jurisdiction.town ?? undefined,
          region: row.jurisdiction.region,
          state: row.jurisdiction.state,
        }
      : undefined,
    jurisdictionCoverage: parseJsonArray(row.jurisdictionCoverage),
    notes: row.notes,
    recurringEventTypes: parseJsonArray(row.recurringEventTypes),
    vendorHeavy: row.vendorHeavy,
    fitScore: row.fitScore,
    internalOnly: row.internalOnly,
    outreachStatus: row.outreachStatus as OutreachStatus,
    defaultVisibility: row.defaultVisibility as VisibilityLevel,
    contacts: row.contacts.map(mapContact),
    eventProfiles: row.eventProfiles.map(ep => ({
      id: ep.id,
      organizationId: ep.organizationId,
      eventDistrict: ep.eventDistrict ?? undefined,
      eventTypes: parseJsonArray(ep.eventTypes),
      seasonality: ep.seasonality ?? undefined,
      typicalVendorCount: ep.typicalVendorCount ?? undefined,
      notes: ep.notes,
    })),
    outreachActivities: row.outreachActivities.map(oa => ({
      id: oa.id,
      organizationId: oa.organizationId ?? undefined,
      contactId: oa.contactId ?? undefined,
      activityType: oa.activityType,
      summary: oa.summary,
      actorLabel: oa.actorLabel ?? undefined,
      createdAt: oa.createdAt.toISOString(),
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function fetchOrgRows(where?: object) {
  return prisma.opsOrganization.findMany({
    where,
    include: {
      jurisdiction: true,
      contacts: { orderBy: { name: 'asc' } },
      eventProfiles: true,
      outreachActivities: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
    orderBy: { name: 'asc' },
  });
}

export async function ensureOpsContactsDbSeed() {
  if (dbSeeded) return;
  const count = await prisma.jurisdiction.count();
  if (count === 0) {
    for (const j of SEED_JURISDICTIONS) {
      await prisma.jurisdiction.create({
        data: {
          id: j.id,
          name: j.name,
          slug: j.slug,
          county: j.county ?? null,
          town: j.town ?? null,
          region: j.region,
          state: j.state,
        },
      });
    }
    const seedOrgs = buildSeedOpsOrganizations();
    for (const o of seedOrgs) {
      await prisma.opsOrganization.create({
        data: {
          id: o.id,
          type: o.type,
          name: o.name,
          website: o.website ?? null,
          publicPhone: o.publicPhone ?? null,
          publicEmail: o.publicEmail ?? null,
          address: o.address ?? null,
          jurisdictionId: o.jurisdictionId ?? null,
          jurisdictionCoverage: JSON.stringify(o.jurisdictionCoverage),
          notes: o.notes,
          recurringEventTypes: JSON.stringify(o.recurringEventTypes),
          vendorHeavy: o.vendorHeavy,
          fitScore: o.fitScore,
          internalOnly: o.internalOnly,
          outreachStatus: o.outreachStatus,
          defaultVisibility: o.defaultVisibility,
          contacts: {
            create: o.contacts.map(c => ({
              id: c.id,
              name: c.name,
              title: c.title ?? null,
              phone: c.phone ?? null,
              email: c.email ?? null,
              linkedIn: c.linkedIn ?? null,
              department: c.department ?? null,
              preferredContactMethod: c.preferredContactMethod,
              purposeTags: JSON.stringify(c.purposeTags),
              visibility: c.visibility,
              notes: c.notes,
              internalNotes: c.internalNotes ?? '',
            })),
          },
          eventProfiles: {
            create: o.eventProfiles.map(ep => ({
              id: ep.id,
              eventDistrict: ep.eventDistrict ?? null,
              eventTypes: JSON.stringify(ep.eventTypes),
              seasonality: ep.seasonality ?? null,
              typicalVendorCount: ep.typicalVendorCount ?? null,
              notes: ep.notes,
            })),
          },
          outreachActivities: {
            create: o.outreachActivities.map(oa => ({
              id: oa.id,
              activityType: oa.activityType,
              summary: oa.summary,
              actorLabel: oa.actorLabel ?? null,
            })),
          },
        },
      });
    }
  }
  dbSeeded = true;
}

function matchesSearch(org: OpsOrganizationRecord, params: OpsContactsSearchParams): boolean {
  const q = params.q?.toLowerCase().trim();
  if (q) {
    const hay = [
      org.name,
      org.notes,
      org.address ?? '',
      ...org.contacts.map(c => `${c.name} ${c.title ?? ''} ${c.email ?? ''}`),
    ]
      .join(' ')
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (params.county && org.jurisdiction?.county !== params.county) return false;
  if (params.orgType && org.type !== params.orgType) return false;
  if (params.outreachStatus && org.outreachStatus !== params.outreachStatus) return false;
  if (params.purposeTag && !org.contacts.some(c => c.purposeTags.includes(params.purposeTag!)))
    return false;
  return true;
}

export async function searchOrganizationsDb(
  params: OpsContactsSearchParams,
  viewer: ViewerRole
): Promise<OpsOrganizationRecord[]> {
  const rows = await fetchOrgRows();
  return rows
    .map(mapOrg)
    .filter(o => matchesSearch(o, params))
    .map(o => filterOrganizationForViewer(o, viewer))
    .filter((o): o is OpsOrganizationRecord => o !== null);
}

export async function getOrganizationDb(
  id: string,
  viewer: ViewerRole
): Promise<OpsOrganizationRecord | null> {
  const row = await prisma.opsOrganization.findUnique({
    where: { id },
    include: {
      jurisdiction: true,
      contacts: { orderBy: { name: 'asc' } },
      eventProfiles: true,
      outreachActivities: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!row) return null;
  return filterOrganizationForViewer(mapOrg(row), viewer);
}

export async function updateOrganizationDb(
  id: string,
  patch: Partial<Pick<OpsOrganizationRecord, 'outreachStatus' | 'notes' | 'internalOnly' | 'defaultVisibility'>>
) {
  const row = await prisma.opsOrganization.update({
    where: { id },
    data: {
      ...(patch.outreachStatus !== undefined ? { outreachStatus: patch.outreachStatus } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(patch.internalOnly !== undefined ? { internalOnly: patch.internalOnly } : {}),
      ...(patch.defaultVisibility !== undefined ? { defaultVisibility: patch.defaultVisibility } : {}),
    },
    include: {
      jurisdiction: true,
      contacts: true,
      eventProfiles: true,
      outreachActivities: { orderBy: { createdAt: 'desc' } },
    },
  });
  return mapOrg(row);
}

export async function addOutreachActivityDb(input: {
  organizationId: string;
  contactId?: string;
  activityType: string;
  summary: string;
  actorLabel?: string;
}): Promise<OutreachActivityRecord> {
  const row = await prisma.outreachActivity.create({
    data: {
      organizationId: input.organizationId,
      contactId: input.contactId ?? null,
      activityType: input.activityType,
      summary: input.summary,
      actorLabel: input.actorLabel ?? null,
    },
  });
  return {
    id: row.id,
    organizationId: row.organizationId ?? undefined,
    contactId: row.contactId ?? undefined,
    activityType: row.activityType,
    summary: row.summary,
    actorLabel: row.actorLabel ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listJurisdictionsDb() {
  const rows = await prisma.jurisdiction.findMany({ orderBy: { name: 'asc' } });
  return rows.map(j => ({
    id: j.id,
    name: j.name,
    slug: j.slug,
    county: j.county ?? undefined,
    town: j.town ?? undefined,
    region: j.region,
    state: j.state,
  }));
}

export type { ContactPurposeTag };
