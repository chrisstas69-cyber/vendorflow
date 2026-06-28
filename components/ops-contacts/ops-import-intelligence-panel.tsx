'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Database,
  Loader2,
  Play,
  RefreshCw,
  Shield,
} from 'lucide-react';
import type { ImportRunSummary, ScrapeSourceHealthRecord } from '@/lib/ops-contacts-schema';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';

interface SourceHealthResponse {
  sources: ScrapeSourceHealthRecord[];
  chamberCsv: {
    filePath: string;
    exists: boolean;
    rowCount: number;
    lastModified?: string;
  };
}

const ACTION_STYLE: Record<string, string> = {
  create: 'text-emerald-700 bg-emerald-50',
  update: 'text-blue-700 bg-blue-50',
  skip: 'text-stone-600 bg-stone-100',
  conflict: 'text-amber-800 bg-amber-50',
  error: 'text-red-700 bg-red-50',
};

export function OpsImportIntelligencePanel({ onImported }: { onImported?: () => void }) {
  const { surface, muted, heading, btnPrimary, btnSecondary, cardInset } = useOrganizerTheme();
  const [health, setHealth] = useState<SourceHealthResponse | null>(null);
  const [runs, setRuns] = useState<ImportRunSummary[]>([]);
  const [preview, setPreview] = useState<ImportRunSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [healthRes, runsRes] = await Promise.all([
        fetch('/api/ops/sources/health?viewerRole=internal'),
        fetch('/api/ops/import?viewerRole=internal&limit=5'),
      ]);
      const healthData = await healthRes.json();
      const runsData = await runsRes.json();
      if (healthData.ok) setHealth({ sources: healthData.sources, chamberCsv: healthData.chamberCsv });
      if (runsData.ok) setRuns(runsData.runs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load import panel');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runImport = async (dryRun: boolean) => {
    setRunning(true);
    setError('');
    try {
      const res = await fetch('/api/ops/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun, viewerRole: 'internal', actorLabel: 'Organizer internal' }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Import failed');
      if (dryRun) {
        setPreview(data.run);
      } else {
        setPreview(null);
        setToast(data.message);
        setTimeout(() => setToast(''), 5000);
        onImported?.();
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className={`rounded-2xl p-6 flex items-center gap-2 ${surface}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className={`text-sm ${muted}`}>Loading import intelligence…</span>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-5 mb-6 space-y-5 ${surface}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-600" />
            <h2 className={`font-semibold ${heading}`}>Import intelligence (internal)</h2>
          </div>
          <p className={`text-sm mt-1 ${muted}`}>
            Chamber CSV sync with dedupe, dry-run validation, and source health. Not shown to paying clients.
          </p>
        </div>
        <button type="button" onClick={load} className={`p-2 rounded-lg ${btnSecondary}`} aria-label="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {toast && (
        <div className="px-3 py-2 rounded-lg bg-emerald-100 text-emerald-800 text-sm">{toast}</div>
      )}
      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-50 text-red-800 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {health?.chamberCsv && (
        <div className={`rounded-xl p-4 grid sm:grid-cols-3 gap-3 text-sm ${cardInset}`}>
          <div>
            <div className={`text-xs uppercase tracking-wide ${muted}`}>Chamber CSV</div>
            <div className={`font-medium ${heading}`}>{health.chamberCsv.rowCount} rows</div>
          </div>
          <div>
            <div className={`text-xs uppercase tracking-wide ${muted}`}>File modified</div>
            <div className={heading}>
              {health.chamberCsv.lastModified
                ? new Date(health.chamberCsv.lastModified).toLocaleString()
                : '—'}
            </div>
          </div>
          <div>
            <div className={`text-xs uppercase tracking-wide ${muted}`}>Dedupe key</div>
            <div className={muted}>domain → name+county+town+type</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={running}
          onClick={() => runImport(true)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${btnSecondary}`}
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
          Dry run
        </button>
        <button
          type="button"
          disabled={running || !preview}
          onClick={() => runImport(false)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 ${btnPrimary}`}
        >
          <Play className="h-4 w-4" /> Commit import
        </button>
      </div>

      {preview && (
        <div className={`rounded-xl p-4 ${cardInset}`}>
          <div className="flex flex-wrap gap-3 text-sm mb-3">
            <Stat label="Processed" value={preview.rowsProcessed} />
            <Stat label="Create" value={preview.createdCount} good />
            <Stat label="Update" value={preview.updatedCount} />
            <Stat label="Skip" value={preview.skippedCount} />
            <Stat label="Conflict" value={preview.conflictCount} warn={preview.conflictCount > 0} />
            <Stat label="Errors" value={preview.errorCount} warn={preview.errorCount > 0} />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {preview.rows.slice(0, 40).map(row => (
              <div key={`${row.rowIndex}-${row.dedupeKey}`} className="flex items-start gap-2 text-xs">
                <span className={`px-1.5 py-0.5 rounded font-semibold capitalize shrink-0 ${ACTION_STYLE[row.action]}`}>
                  {row.action}
                </span>
                <span className={`min-w-0 ${heading}`}>{row.chamberName}</span>
                <span className={`${muted} truncate`}>{row.reason}</span>
              </div>
            ))}
            {preview.rows.length > 40 && (
              <p className={`text-xs ${muted}`}>+ {preview.rows.length - 40} more rows</p>
            )}
          </div>
        </div>
      )}

      {health?.sources && (
        <div>
          <h3 className={`text-sm font-semibold mb-2 ${heading}`}>Source health</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {health.sources.slice(0, 9).map(src => (
              <div key={src.id} className={`rounded-lg p-3 text-xs ${cardInset}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-medium truncate ${heading}`}>{src.name}</span>
                  <StatusDot status={src.status} />
                </div>
                <div className={`mt-1 ${muted}`}>
                  {src.outputCount != null && `${src.outputCount} outputs · `}
                  {src.lastCheckedAt
                    ? `checked ${new Date(src.lastCheckedAt).toLocaleDateString()}`
                    : 'not checked yet'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {runs.length > 0 && (
        <div>
          <h3 className={`text-sm font-semibold mb-2 ${heading}`}>Recent import runs</h3>
          <ul className="space-y-1 text-xs">
            {runs.map(r => (
              <li key={r.id} className={`flex flex-wrap gap-2 ${muted}`}>
                <span>{new Date(r.createdAt).toLocaleString()}</span>
                <span className="capitalize">{r.status}</span>
                <span>
                  +{r.createdCount} / ~{r.updatedCount} / skip {r.skippedCount}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  good,
  warn,
}: {
  label: string;
  value: number;
  good?: boolean;
  warn?: boolean;
}) {
  return (
    <div>
      <span className="text-stone-500">{label}: </span>
      <span
        className={
          good ? 'text-emerald-700 font-semibold' : warn ? 'text-amber-700 font-semibold' : 'font-semibold'
        }
      >
        {value}
      </span>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'active'
      ? 'bg-emerald-500'
      : status === 'degraded'
        ? 'bg-amber-500'
        : status === 'inactive'
          ? 'bg-stone-400'
          : 'bg-stone-300';
  return (
    <span className="inline-flex items-center gap-1 capitalize text-stone-500">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {status}
    </span>
  );
}
