import { getPilotDataSource } from '@/lib/pilot-config';
import { isHostedDatabaseUrl, prisma } from '@/lib/prisma';

export interface DbStatusSnapshot {
  pilotDataSource: 'seed' | 'db';
  databaseUrlKind: 'none' | 'sqlite-file' | 'postgres';
  prismaReachable: boolean;
  effectiveMode: 'seed' | 'db';
  hint?: string;
}

let cached: DbStatusSnapshot | null = null;
let cachedAt = 0;
const CACHE_MS = 30_000;

/** Probe hosted DB connectivity — cached briefly per serverless instance */
export async function getDbStatus(): Promise<DbStatusSnapshot> {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_MS) return cached;

  const pilotDataSource = getPilotDataSource();
  const url = process.env.DATABASE_URL ?? '';
  const databaseUrlKind = !url
    ? 'none'
    : url.startsWith('file:')
      ? 'sqlite-file'
      : isHostedDatabaseUrl(url)
        ? 'postgres'
        : 'none';

  let prismaReachable = false;
  if (isHostedDatabaseUrl(url)) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      prismaReachable = true;
    } catch {
      prismaReachable = false;
    }
  }

  let effectiveMode: 'seed' | 'db' = 'seed';
  let hint: string | undefined;

  if (pilotDataSource === 'db') {
    if (prismaReachable) {
      effectiveMode = 'db';
    } else {
      effectiveMode = 'seed';
      hint =
        databaseUrlKind === 'sqlite-file'
          ? 'PILOT_DATA_SOURCE=db but DATABASE_URL is SQLite file — use Neon Postgres on Vercel'
          : 'PILOT_DATA_SOURCE=db but Postgres unreachable — check DATABASE_URL / DIRECT_URL';
    }
  } else {
    hint = 'PILOT_DATA_SOURCE=seed — in-memory stores (resets on cold start)';
  }

  cached = { pilotDataSource, databaseUrlKind, prismaReachable, effectiveMode, hint };
  cachedAt = now;
  return cached;
}

export function resetDbStatusCache() {
  cached = null;
  cachedAt = 0;
}
