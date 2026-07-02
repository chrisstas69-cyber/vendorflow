import { getDbStatus } from '@/lib/db-status';
import { getEffectiveDataSource, getPilotConfigSnapshot } from '@/lib/pilot-config';
import { canSendEmail } from '@/lib/auth/session';

export type HealthStatus = 'ok' | 'warn' | 'error' | 'unknown';

export interface HealthCheck {
  id: string;
  label: string;
  status: HealthStatus;
  detail: string;
}

export interface HealthSnapshot {
  ok: boolean;
  checkedAt: string;
  app: {
    version: string;
    nodeEnv: string;
    vercelEnv: string | null;
    appUrl: string | null;
    commit: string | null;
  };
  checks: HealthCheck[];
}

function statusFrom(cond: boolean, warnIfFalse = false): HealthStatus {
  if (cond) return 'ok';
  return warnIfFalse ? 'warn' : 'error';
}

/** Build a redacted ops snapshot — never includes secret values. */
export async function buildHealthSnapshot(): Promise<HealthSnapshot> {
  const db = await getDbStatus();
  const effectiveDataSource = getEffectiveDataSource();
  const pilot = getPilotConfigSnapshot();

  const authSecretSet = Boolean(process.env.AUTH_SECRET);
  const sentryDsnSet = Boolean(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN);
  const resendSet = canSendEmail();
  const devMagicLink = process.env.ALLOW_DEV_MAGIC_LINK === 'true';
  const onVercel = Boolean(process.env.VERCEL);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? null;

  const checks: HealthCheck[] = [
    {
      id: 'database',
      label: 'Database',
      status: db.prismaReachable ? 'ok' : effectiveDataSource === 'db' ? 'error' : 'warn',
      detail: db.prismaReachable
        ? `Postgres reachable · mode ${effectiveDataSource}`
        : db.hint ?? 'Postgres not reachable',
    },
    {
      id: 'data-source',
      label: 'Data mode',
      status: effectiveDataSource === 'db' ? 'ok' : 'warn',
      detail:
        effectiveDataSource === 'db'
          ? 'Pilot reads/writes Postgres'
          : 'Seed mode — data resets on cold start',
    },
    {
      id: 'auth-secret',
      label: 'AUTH_SECRET',
      status: statusFrom(authSecretSet, process.env.NODE_ENV !== 'production'),
      detail: authSecretSet
        ? 'Session signing key configured'
        : process.env.NODE_ENV === 'production'
          ? 'Required in production — sessions are forgeable without it'
          : 'Using dev fallback locally',
    },
    {
      id: 'magic-link-email',
      label: 'Magic-link email',
      status: resendSet ? 'ok' : devMagicLink ? 'warn' : 'warn',
      detail: resendSet
        ? 'Resend configured — links sent by email'
        : devMagicLink
          ? 'Dev link mode ON — remove ALLOW_DEV_MAGIC_LINK when Resend is live'
          : 'No email provider — sign-in links disabled in production',
    },
    {
      id: 'sentry',
      label: 'Sentry',
      status: sentryDsnSet ? 'ok' : 'warn',
      detail: sentryDsnSet
        ? 'DSN configured — errors will be captured after deploy'
        : 'Add SENTRY_DSN + NEXT_PUBLIC_SENTRY_DSN in Vercel, then redeploy',
    },
    {
      id: 'analytics',
      label: 'Vercel Analytics',
      status: onVercel ? 'ok' : 'warn',
      detail: onVercel
        ? 'Package wired — enable Analytics in Vercel project settings if not already'
        : 'Runs on Vercel deploys; local dev does not send page views',
    },
    {
      id: 'app-url',
      label: 'App URL',
      status: appUrl ? 'ok' : 'warn',
      detail: appUrl ?? 'Set NEXT_PUBLIC_APP_URL for correct magic links and sitemap',
    },
    {
      id: 'pilot',
      label: 'Pilot config',
      status: pilot.enabled ? 'ok' : 'warn',
      detail: pilot.enabled
        ? `${pilot.organizer?.organization ?? 'Organizer'} · ${pilot.dataSource} source`
        : 'Pilot mode off',
    },
  ];

  const hasError = checks.some(c => c.status === 'error');
  const ok = !hasError;

  return {
    ok,
    checkedAt: new Date().toISOString(),
    app: {
      version: process.env.npm_package_version ?? '3.0.0',
      nodeEnv: process.env.NODE_ENV ?? 'development',
      vercelEnv: process.env.VERCEL_ENV ?? null,
      appUrl,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    },
    checks,
  };
}
