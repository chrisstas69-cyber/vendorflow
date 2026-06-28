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
import { loadChamberOpsOrganizations, mergeOpsOrganizations } from '@/lib/import/chambers-to-ops';
import { applyChamberImport, previewChamberImport } from '@/lib/import/chamber-import';
import type { ImportRunSummary } from '@/lib/ops-contacts-schema';

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

function mapImportFields(row: {
  canonicalName: string | null;
  normalizedDomain: string | null;
  dedupeKey: string | null;
  county: string | null;
  town: string | null;
  sourceSystem: string | null;
  sourceFile: string | null;
  sourceUrl: string | null;
  sourcePriority: number;
  lastImportedAt: Date | null;
  lastSeenAt: Date | null;
  importRunId: string | null;
  manuallyEdited: boolean;
}) {
  return {
    canonicalName: row.canonicalName ?? undefined,
    normalizedDomain: row.normalizedDomain,
    dedupeKey: row.dedupeKey ?? undefined,
    county: row.county ?? undefined,
    town: row.town ?? undefined,
    sourceSystem: (row.sourceSystem as 'manual' | 'tracker' | 'legacy') ?? undefined,
    sourceFile: row.sourceFile ?? undefined,
    sourceUrl: row.sourceUrl ?? undefined,
    sourcePriority: row.sourcePriority,
    lastImportedAt: row.lastImportedAt?.toISOString(),
    lastSeenAt: row.lastSeenAt?.toISOString(),
    importRunId: row.importRunId ?? undefined,
    manuallyEdited: row.manuallyEdited,
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
    import: mapImportFields(row),
  };
}

function orgCreateData(o: OpsOrganizationRecord) {
  return {
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
    canonicalName: o.import?.canonicalName ?? null,
    normalizedDomain: o.import?.normalizedDomain ?? null,
    dedupeKey: o.import?.dedupeKey ?? null,
    county: o.import?.county ?? null,
    town: o.import?.town ?? null,
    sourceSystem: o.import?.sourceSystem ?? null,
    sourceFile: o.import?.sourceFile ?? null,
    sourceUrl: o.import?.sourceUrl ?? null,
    sourcePriority: o.import?.sourcePriority ?? 50,
    lastImportedAt: o.import?.lastImportedAt ? new Date(o.import.lastImportedAt) : null,
    lastSeenAt: o.import?.lastSeenAt ? new Date(o.import.lastSeenAt) : null,
    importRunId: o.import?.importRunId ?? null,
    manuallyEdited: o.import?.manuallyEdited ?? false,
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
    const seedOrgs = mergeOpsOrganizations(
      buildSeedOpsOrganizations(),
      loadChamberOpsOrganizations()
    );
    for (const o of seedOrgs) {
      await prisma.opsOrganization.create({
        data: {
          ...orgCreateData(o),
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
      manuallyEdited: true,
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

async function fetchAllOrgsDb(): Promise<OpsOrganizationRecord[]> {
  const rows = await fetchOrgRows();
  return rows.map(mapOrg);
}

export async function runChamberImportDb(input: {
  dryRun: boolean;
  filePath?: string;
  actorLabel?: string;
  forceOverwriteManual?: boolean;
}): Promise<ImportRunSummary> {
  await ensureOpsContactsDbSeed();
  const existing = await fetchAllOrgsDb();

  if (input.dryRun) {
    return previewChamberImport({
      dryRun: true,
      filePath: input.filePath,
      actorLabel: input.actorLabel,
      forceOverwriteManual: input.forceOverwriteManual,
      existingOrgs: existing,
    });
  }

  const { organizations: next, run } = applyChamberImport({
    dryRun: false,
    filePath: input.filePath,
    actorLabel: input.actorLabel,
    forceOverwriteManual: input.forceOverwriteManual,
    existingOrgs: existing,
  });

  for (const org of next) {
    const data = orgCreateData(org);
    await prisma.opsOrganization.upsert({
      where: { id: org.id },
      create: {
        ...data,
        contacts: {
          create: org.contacts.map(c => ({
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
      },
      update: data,
    });
  }

  await prisma.importRun.create({
    data: {
      id: run.id,
      sourceSystem: run.sourceSystem,
      sourceFile: run.sourceFile ?? null,
      dryRun: false,
      status: run.status,
      rowsProcessed: run.rowsProcessed,
      createdCount: run.createdCount,
      updatedCount: run.updatedCount,
      skippedCount: run.skippedCount,
      conflictCount: run.conflictCount,
      errorCount: run.errorCount,
      summaryJson: JSON.stringify({ rows: run.rows }),
      actorLabel: run.actorLabel ?? null,
    },
  });

  return run;
}

export async function listImportRunsDb(limit = 20): Promise<ImportRunSummary[]> {
  const rows = await prisma.importRun.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map(r => {
    const summary = JSON.parse(r.summaryJson || '{}') as { rows?: ImportRunSummary['rows'] };
    return {
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      sourceSystem: r.sourceSystem,
      sourceFile: r.sourceFile ?? undefined,
      dryRun: r.dryRun,
      status: r.status as ImportRunSummary['status'],
      rowsProcessed: r.rowsProcessed,
      createdCount: r.createdCount,
      updatedCount: r.updatedCount,
      skippedCount: r.skippedCount,
      conflictCount: r.conflictCount,
      errorCount: r.errorCount,
      rows: summary.rows ?? [],
      actorLabel: r.actorLabel ?? undefined,
    };
  });
}

export type { ContactPurposeTag };
