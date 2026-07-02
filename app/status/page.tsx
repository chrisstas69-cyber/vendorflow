'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PublicLayout } from '@/components/layout/public-layout';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  Radio,
} from 'lucide-react';
import type { HealthCheck, HealthSnapshot } from '@/lib/health-snapshot';

type HealthResponse = HealthSnapshot & {
  sentryPing?: { sent: boolean; detail: string };
};

const STATUS_ICON = {
  ok: CheckCircle2,
  warn: AlertTriangle,
  error: XCircle,
  unknown: HelpCircle,
} as const;

const STATUS_STYLE = {
  ok: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800',
  warn: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
  error: 'text-red-700 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800',
  unknown: 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700',
} as const;

function CheckRow({ check }: { check: HealthCheck }) {
  const Icon = STATUS_ICON[check.status];
  return (
    <div className={`flex gap-3 rounded-xl border p-4 ${STATUS_STYLE[check.status]}`}>
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="font-semibold text-sm">{check.label}</div>
        <p className="text-sm mt-0.5 opacity-90">{check.detail}</p>
      </div>
    </div>
  );
}

export default function StatusPage() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      const json = (await res.json()) as HealthResponse;
      setData(json);
    } catch {
      setError('Could not reach /api/health');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pingSentry = async () => {
    setPinging(true);
    setPingResult(null);
    try {
      const res = await fetch('/api/health?ping=sentry', { cache: 'no-store' });
      const json = (await res.json()) as HealthResponse;
      setData(json);
      setPingResult(json.sentryPing?.detail ?? 'No response');
    } catch {
      setPingResult('Ping request failed');
    } finally {
      setPinging(false);
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-6 w-6 text-amber-500" />
              <h1 className="text-2xl font-bold public-heading">System status</h1>
            </div>
            <p className="text-sm public-muted">
              Live ops snapshot — confirms DB, auth, monitoring, and pilot config. No secrets shown.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium public-muted hover:opacity-80 shrink-0"
            style={{ borderColor: 'var(--pub-border)' }}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading && !data && (
          <p className="text-sm public-muted text-center py-12">Checking systems…</p>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 mb-6">
            {error}
          </div>
        )}

        {data && (
          <>
            <div
              className={`rounded-2xl border p-5 mb-6 ${
                data.ok
                  ? 'border-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/20'
                  : 'border-amber-200 bg-amber-50/80 dark:bg-amber-950/20'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-lg">
                {data.ok ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                )}
                {data.ok ? 'All critical systems go' : 'Needs attention'}
              </div>
              <div className="text-xs public-muted mt-2 space-y-0.5">
                <div>Checked {new Date(data.checkedAt).toLocaleString()}</div>
                {data.app.vercelEnv && <div>Environment: {data.app.vercelEnv}</div>}
                {data.app.commit && <div>Commit: {data.app.commit}</div>}
                {data.app.appUrl && <div>URL: {data.app.appUrl}</div>}
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {data.checks.map(check => (
                <CheckRow key={check.id} check={check} />
              ))}
            </div>

            <div
              className="rounded-2xl border p-5 mb-8"
              style={{ borderColor: 'var(--pub-border)', background: 'var(--pub-footer)' }}
            >
              <h2 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Radio className="h-4 w-4 text-amber-500" />
                Test Sentry
              </h2>
              <p className="text-sm public-muted mb-4">
                Sends a harmless test event. After clicking, open your Sentry project → Issues and look for
                &quot;VendorFlow health-check ping&quot;.
              </p>
              <button
                type="button"
                onClick={() => void pingSentry()}
                disabled={pinging}
                className="px-4 py-2 rounded-lg bg-amber-500 text-gray-900 text-sm font-semibold hover:bg-amber-600 disabled:opacity-50"
              >
                {pinging ? 'Sending…' : 'Send test event'}
              </button>
              {pingResult && (
                <p className="text-sm mt-3 public-muted">{pingResult}</p>
              )}
            </div>

            <div className="text-xs public-muted space-y-2 border-t pt-6" style={{ borderColor: 'var(--pub-border)' }}>
              <p>
                <strong>Vercel Analytics</strong> does not expose a ping API — after enabling in the Vercel
                dashboard, browse a few pages and check Analytics → Web within a few minutes.
              </p>
              <p>
                Raw JSON:{' '}
                <Link href="/api/health" className="text-amber-600 hover:underline font-mono">
                  /api/health
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
}
