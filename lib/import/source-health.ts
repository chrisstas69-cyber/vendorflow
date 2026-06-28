import fs from 'fs';
import path from 'path';
import type { ScrapeSourceHealthRecord } from '@/lib/ops-contacts-schema';
import { SCRAPE_SOURCES } from '@/lib/import/scrape-sources';
import { loadChamberListFromFile } from '@/lib/import/chamber-list';

function parseLastChecked(raw?: string): Date | null {
  if (!raw?.trim()) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Build source health from static registry + chamber CSV last_checked column */
export function buildSourceHealthSnapshot(): ScrapeSourceHealthRecord[] {
  const chambers = loadChamberListFromFile();
  const chamberChecks = chambers
    .map(c => parseLastChecked(c.lastChecked))
    .filter((d): d is Date => d !== null);
  const latestChamberCheck =
    chamberChecks.length > 0
      ? new Date(Math.max(...chamberChecks.map(d => d.getTime()))).toISOString()
      : undefined;

  return SCRAPE_SOURCES.map(src => {
    if (src.id === 'chambers-csv') {
      const activeCount = chambers.filter(c => c.status === 'active' || !c.status).length;
      return {
        id: src.id,
        name: src.name,
        status: src.active ? 'active' : 'inactive',
        active: src.active,
        lastCheckedAt: latestChamberCheck,
        lastSuccessAt: latestChamberCheck,
        outputCount: chambers.length,
        region: src.region,
        category: src.category,
      } satisfies ScrapeSourceHealthRecord;
    }

    return {
      id: src.id,
      name: src.name,
      status: src.active ? 'unknown' : 'inactive',
      active: src.active,
      region: src.region,
      category: src.category,
      outputCount: undefined,
    } satisfies ScrapeSourceHealthRecord;
  });
}

/** Persist scrape health check result (called after scraper runs) */
export function recordScrapeHealthSeed(input: {
  sourceId: string;
  success: boolean;
  outputCount?: number;
  error?: string;
}): ScrapeSourceHealthRecord | null {
  const snapshot = buildSourceHealthSnapshot();
  const idx = snapshot.findIndex(s => s.id === input.sourceId);
  if (idx < 0) return null;

  const now = new Date().toISOString();
  const current = healthOverrides.get(input.sourceId) ?? snapshot[idx];
  const next: ScrapeSourceHealthRecord = {
    ...current,
    lastCheckedAt: now,
    ...(input.success
      ? { lastSuccessAt: now, status: 'active' as const, outputCount: input.outputCount }
      : { lastFailureAt: now, lastError: input.error, status: 'degraded' as const }),
  };
  healthOverrides.set(input.sourceId, next);
  return next;
}

const healthOverrides = new Map<string, ScrapeSourceHealthRecord>();

export function getSourceHealthSnapshot(): ScrapeSourceHealthRecord[] {
  const base = buildSourceHealthSnapshot();
  return base.map(s => healthOverrides.get(s.id) ?? s);
}

export function chamberCsvFreshness(): {
  filePath: string;
  exists: boolean;
  rowCount: number;
  lastModified?: string;
} {
  const filePath = path.join(process.cwd(), 'data', 'chamber_list.csv');
  if (!fs.existsSync(filePath)) {
    return { filePath, exists: false, rowCount: 0 };
  }
  const stat = fs.statSync(filePath);
  const rows = loadChamberListFromFile();
  return {
    filePath,
    exists: true,
    rowCount: rows.length,
    lastModified: stat.mtime.toISOString(),
  };
}
