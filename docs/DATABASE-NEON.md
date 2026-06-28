# Neon Postgres — hosted database for VendorFlow

VendorFlow platform data (organizer workflow, ops contacts, booths, galleries) runs on **Neon Postgres** in production. The event scraper continues to use separate SQLite at `data/events.db`.

## Why Neon (not Turso)

| Factor | Neon Postgres | Turso (libSQL) |
|--------|---------------|----------------|
| Prisma schema | Native `postgresql` provider — no adapter changes | Requires `@libsql/client` + driver adapter |
| JSON / relations | Current schema uses String JSON fields + relations — maps cleanly | Works, but extra wiring |
| Migrations | Standard Prisma migrate workflow | Supported but less common in this codebase |
| Vercel integration | First-class Neon ↔ Vercel integration | Supported via Turso |

**Recommendation: Neon** unless you have an existing Turso investment.

---

## Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (Production + Preview recommended):

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://…@ep-….pooler.neon.tech/neondb?sslmode=require` | Neon **pooled** connection string for serverless |
| `DIRECT_URL` | `postgresql://…@ep-….neon.tech/neondb?sslmode=require` | Neon **direct** URL for migrations |
| `PILOT_DATA_SOURCE` | `db` | Enables Prisma-backed organizer/ops/booth paths |
| `PILOT_MODE` | `true` | Unchanged — pilot UX |

Local `.env.local` — see `.env.local.example`.

---

## Build & Prisma on Vercel

| Step | Command | When |
|------|---------|------|
| Client generation | `postinstall`: `prisma generate` | Every deploy (configured) |
| Schema apply | `npm run db:migrate:deploy` | Manual / CI before or after first deploy |
| Bootstrap data | `npm run db:seed-hosted` | Once after migrate |

**Do not** run `prisma db push` in `postinstall` on Vercel.

---

## Serverless caveats

1. Use **pooled** `DATABASE_URL` at runtime; **direct** `DIRECT_URL` for migrations only.
2. `lib/prisma.ts` caches PrismaClient on `globalThis`.
3. If Postgres is unreachable, app falls back to seed stores — check `GET /api/pilot` → `db.effectiveMode`.
4. With `db` mode + Neon, data persists across cold starts.

---

## Production cutover sequence

1. Create Neon project → copy pooled + direct URLs
2. `npm run db:migrate:deploy` (with env vars set locally)
3. `PILOT_DATA_SOURCE=db npm run db:seed-hosted`
4. Set Vercel env: `DATABASE_URL`, `DIRECT_URL`, `PILOT_DATA_SOURCE=db`
5. `git push vendorflow main && npx vercel deploy --prod`
6. Verify `GET /api/pilot` shows `effectiveMode: "db"`

## Rollback

- Promote previous Vercel deployment, or
- Set `PILOT_DATA_SOURCE=seed` (Neon data preserved)

---

## Smoke tests after cutover

| Test | Pass |
|------|------|
| `GET /api/pilot` | `db.effectiveMode === "db"` |
| Booth POST → GET | Assignment persists |
| Import commit | ImportRun row created |
| Contacts PATCH | Outreach status persists after reload |
| Application approve | Status persists after reload |

---

## `db push` vs migrations

| | Use when |
|--|----------|
| `prisma db push` | Local prototyping only |
| `prisma migrate deploy` | **Production** — use after this cutover |

**Switch to proper migrations now.** Initial migration: `prisma/migrations/20250628000000_init_postgres/`. Use `prisma migrate dev` locally for future schema changes.
