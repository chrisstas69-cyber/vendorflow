import type { ImportRowResult, ImportRunSummary, OpsOrganizationRecord } from '@/lib/ops-contacts-schema';
import { buildOrgIdentity } from '@/lib/import/identity';
import { diffOrgFields, indexOrgsByDedupeKey } from '@/lib/import/merge-orgs';
import { chamberToOpsOrg, loadChamberListFromFile } from '@/lib/import/chambers-to-ops';

export interface ChamberImportOptions {
  dryRun?: boolean;
  filePath?: string;
  actorLabel?: string;
  forceOverwriteManual?: boolean;
  existingOrgs: OpsOrganizationRecord[];
}

function makeRunId(): string {
  return `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function previewChamberImport(options: ChamberImportOptions): ImportRunSummary {
  const { filePath, actorLabel, existingOrgs, forceOverwriteManual = false } = options;
  const runId = makeRunId();
  const now = new Date().toISOString();
  const sourceFile = filePath ?? 'data/chamber_list.csv';

  const chambers = loadChamberListFromFile(filePath);
  const existingByKey = indexOrgsByDedupeKey(existingOrgs);
  const rows: ImportRowResult[] = [];

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let conflictCount = 0;
  let errorCount = 0;

  for (const ch of chambers) {
    const rowIndex = ch.rowIndex ?? 0;
    try {
      const incoming = chamberToOpsOrg(ch);
      const key = incoming.import?.dedupeKey ?? buildOrgIdentity({
        name: ch.name,
        website: ch.url,
        orgType: 'chamber',
        county: ch.county,
        town: ch.town,
      }).dedupeKey;

      const existing = existingByKey.get(key);

      if (!existing) {
        rows.push({
          rowIndex,
          chamberName: ch.name,
          dedupeKey: key,
          action: 'create',
          reason: 'New organization — no dedupe match in current database',
        });
        createdCount++;
        continue;
      }

      if (existing.import?.manuallyEdited && !forceOverwriteManual) {
        rows.push({
          rowIndex,
          chamberName: ch.name,
          dedupeKey: key,
          action: 'conflict',
          existingId: existing.id,
          reason: 'Skipped — organization was manually edited since last import',
        });
        conflictCount++;
        continue;
      }

      const existingPri = existing.import?.sourcePriority ?? 0;
      const incomingPri = incoming.import?.sourcePriority ?? 0;
      if (existingPri > incomingPri && existing.import?.sourceSystem === 'manual') {
        rows.push({
          rowIndex,
          chamberName: ch.name,
          dedupeKey: key,
          action: 'skip',
          existingId: existing.id,
          reason: 'Skipped — manual seed record has higher source priority',
        });
        skippedCount++;
        continue;
      }

      const changedFields = diffOrgFields(existing, incoming);
      if (changedFields.length === 0) {
        rows.push({
          rowIndex,
          chamberName: ch.name,
          dedupeKey: key,
          action: 'skip',
          existingId: existing.id,
          reason: 'Unchanged — lastSeenAt would refresh only',
        });
        skippedCount++;
        continue;
      }

      rows.push({
        rowIndex,
        chamberName: ch.name,
        dedupeKey: key,
        action: 'update',
        existingId: existing.id,
        reason: `Would update ${changedFields.length} field(s)`,
        changedFields,
      });
      updatedCount++;
    } catch (err) {
      rows.push({
        rowIndex,
        chamberName: ch.name,
        dedupeKey: '',
        action: 'error',
        reason: err instanceof Error ? err.message : 'Parse error',
      });
      errorCount++;
    }
  }

  return {
    id: runId,
    createdAt: now,
    sourceSystem: 'tracker',
    sourceFile,
    dryRun: options.dryRun !== false,
    status: 'preview',
    rowsProcessed: chambers.length,
    createdCount,
    updatedCount,
    skippedCount,
    conflictCount,
    errorCount,
    rows,
    actorLabel,
  };
}

/** Apply import — returns updated org list and run summary */
export function applyChamberImport(
  options: ChamberImportOptions
): { organizations: OpsOrganizationRecord[]; run: ImportRunSummary } {
  const preview = previewChamberImport({ ...options, dryRun: false });
  const now = new Date().toISOString();
  const orgMap = new Map(options.existingOrgs.map(o => [o.id, { ...o }]));
  const byKey = indexOrgsByDedupeKey(options.existingOrgs);

  for (const row of preview.rows) {
    if (row.action === 'error') continue;

    const ch = loadChamberListFromFile(options.filePath).find(
      c => c.rowIndex === row.rowIndex || c.name === row.chamberName
    );
    if (!ch) continue;

    const incoming = chamberToOpsOrg(ch);
    incoming.import = {
      ...incoming.import,
      lastImportedAt: now,
      lastSeenAt: ch.lastChecked ?? now,
      importRunId: preview.id,
    };

    if (row.action === 'create') {
      orgMap.set(incoming.id, incoming);
      byKey.set(row.dedupeKey, incoming);
      continue;
    }

    if (row.action === 'update' && row.existingId) {
      const existing = orgMap.get(row.existingId);
      if (!existing) continue;
      const merged: OpsOrganizationRecord = {
        ...existing,
        name: incoming.name,
        website: incoming.website,
        address: incoming.address,
        notes: incoming.notes,
        fitScore: incoming.fitScore,
        outreachStatus: existing.import?.manuallyEdited
          ? existing.outreachStatus
          : incoming.outreachStatus,
        jurisdictionCoverage: incoming.jurisdictionCoverage,
        eventProfiles: incoming.eventProfiles,
        import: {
          ...existing.import,
          ...incoming.import,
          manuallyEdited: existing.import?.manuallyEdited ?? false,
        },
        updatedAt: now,
      };
      orgMap.set(row.existingId, merged);
      byKey.set(row.dedupeKey, merged);
    }
  }

  return {
    organizations: Array.from(orgMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    run: {
      ...preview,
      dryRun: false,
      status: preview.errorCount > 0 && preview.createdCount + preview.updatedCount === 0 ? 'failed' : 'completed',
    },
  };
}
