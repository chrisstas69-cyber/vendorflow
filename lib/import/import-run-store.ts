import type { ImportRunSummary } from '@/lib/ops-contacts-schema';

const runs: ImportRunSummary[] = [];

export function saveImportRunSeed(run: ImportRunSummary): ImportRunSummary {
  runs.unshift(run);
  if (runs.length > 50) runs.pop();
  return run;
}

export function listImportRunsSeed(limit = 20): ImportRunSummary[] {
  return runs.slice(0, limit);
}

export function getImportRunSeed(id: string): ImportRunSummary | null {
  return runs.find(r => r.id === id) ?? null;
}
