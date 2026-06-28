# Neon Postgres — DB cutover guide

VendorFlow **platform data** (organizer workflow, ops contacts, booths, galleries, payments) uses **Neon Postgres** via Prisma. The **event scraper** remains on separate SQLite at `data/events.db` (`lib/db.ts`) — unchanged by this cutover.

**Prep commit:** `206120d` (+ any cutover-readiness fixes on `main`)

---

## Connection URL pattern (critical)

| Env var | Neon URL type | Hostname pattern |
|---------|---------------|------------------|
| `DATABASE_URL` | **Pooled** (runtime / Vercel serverless) | contains `-pooler` |
| `DIRECT_URL` | **Direct** (migrations only) | no `-pooler` |

Example:
```bash
DATABASE_URL="postgresql://user:pass@ep-abc-123-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-abc-123.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

---

## `/api/pilot` — cutover health check

Call **after** deploy with env vars set:

```bash
curl https://vendorflow-mu.vercel.app/api/pilot
```

| Field | Meaning |
|-------|---------|
| `dataSource` | **Configured** env `PILOT_DATA_SOURCE` (`seed` or `db`) |
| `effectiveDataSource` | **Runtime** mode after connectivity probe (matches what APIs use) |
| `db.pilotDataSource` | Same as configured `PILOT_DATA_SOURCE` |
| `db.databaseUrlKind` | `postgres` \| `sqlite-file` \| `none` |
| `db.prismaReachable` | `true` if `SELECT 1` against hosted Postgres succeeds |
| `db.effectiveMode` | Same as `effectiveDataSource` |
| `db.hint` | Human-readable misconfiguration message if any |

**Cutover pass criteria:**
```json
{
  "dataSource": "db",
  "effectiveDataSource": "db",
  "db": {
    "databaseUrlKind": "postgres",
    "prismaReachable": true,
    "effectiveMode": "db"
  }
}
```

If `dataSource` is `db` but `effectiveDataSource` is `seed`, Postgres is unreachable or bootstrap failed — check URLs and run `db:seed-hosted`.

---

## Environment variables

### Vercel Production

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon **pooled** URL |
| `DIRECT_URL` | Neon **direct** URL |
| `PILOT_DATA_SOURCE` | `db` |
| `PILOT_MODE` | `true` |

**Redeploy required** after changing env vars.

### Local `.env.local`

Copy from `.env.local.example`. Both URLs required (Prisma schema uses `directUrl`).

---

## Cutover checklist (operator — run in order)

### 1. Pull latest code
```bash
cd vendorflow
git pull vendorflow main
npm install
```

### 2. Create Neon project
- [console.neon.tech](https://console.neon.tech) → new project `vendorflow-prod`
- Copy **pooled** → `DATABASE_URL`
- Copy **direct** → `DIRECT_URL`
- Confirm pooled hostname contains `-pooler`

### 3. Export env locally
```bash
export DATABASE_URL="postgresql://…-pooler…?sslmode=require"
export DIRECT_URL="postgresql://…direct…?sslmode=require"
export PILOT_DATA_SOURCE=db
```

### 4. Apply migrations (production — not `db push`)
```bash
npm run db:migrate:deploy
```
Expect: `Applying migration 20250628000000_init_postgres`

### 5. Bootstrap pilot data
```bash
npm run db:seed-hosted
```
Expect counts: organizers ≥ 1, applications ≥ 6, opsOrgs ~180+, importRuns ≥ 1

### 6. Local smoke (optional)
```bash
npm run dev
curl http://localhost:3002/api/pilot
curl "http://localhost:3002/api/organizer/applications?organizerId=org-demo"
```

### 7. Set Vercel Production env vars
All four vars from table above.

### 8. Redeploy
```bash
npx vercel deploy --prod
```

### 9. Production health check
```bash
curl https://vendorflow-mu.vercel.app/api/pilot
curl "https://vendorflow-mu.vercel.app/api/organizer/applications?organizerId=org-demo"
```
Second call should return `effectiveDataSource: "db"` and `items.length > 0`.

---

## Post-cutover verification

### 1. Applications persistence
1. Open `/organizer/applications`
2. Open drawer → **Approve** a pending vendor
3. Hard reload page
4. **Pass:** status remains `approved`

API check:
```bash
curl "https://vendorflow-mu.vercel.app/api/organizer/applications?organizerId=org-demo" | jq '.effectiveDataSource, (.items | length)'
```

### 2. Booth persistence
1. Open `/organizer/booths` → select event → assign vendor → **Save**
2. Hard reload
3. **Pass:** vendor still on booth

API check:
```bash
curl "https://vendorflow-mu.vercel.app/api/organizer/booths?organizerId=org-demo&eventId=evt-001" | jq '.dataSource, .assignments'
```
(`dataSource` in booth response is `db` when effective mode is db)

### 3. Import run persistence
1. `/organizer/contacts?view=internal` → **Dry run** → review counts
2. Do **not** commit unless intended
3. If committed: `GET /api/ops/import?viewerRole=internal` lists the run after reload

### 4. Contacts edit persistence
1. Internal contacts view → open org → change **outreach status** or add note
2. Reload page
3. **Pass:** change still visible

Requires `PATCH /api/ops/organizations/[id]` (db-backed when effective mode is db).

### 5. Cold-start durability
1. Save a booth assignment (step 2)
2. Wait 5–10 minutes (no traffic)
3. `GET /api/organizer/booths?…` again
4. **Pass:** assignment still present (seed mode would also lose this on cold start; db mode must not)

---

## Runtime data paths — DB vs seed

| Area | DB mode (`effectiveDataSource=db`) | Seed mode |
|------|-----------------------------------|-----------|
| Applications list/actions | `/api/organizer/applications` → Prisma | In-memory `organizer-server-store` |
| `/organizer/applications` UI | API-backed (`useOrganizerInbox`) | Same API; falls back if DB empty |
| Organizer dashboard | API-backed (`useOrganizerInbox`) | Same |
| Booths / Street Fair | `/api/organizer/booths` → Prisma | In-memory `booth-layout-seed-store` |
| Ops contacts / import | Prisma + `ImportRun` table | In-memory seed + import-run store |
| Activity feed | Prisma | Empty stub in API |
| Galleries | Prisma | In-memory seed store |
| Events / series metadata | Still from `mockPlatformEvents` in code | Same (not in Postgres yet) |
| Vendor apply flow (`/events/[id]`) | `useDemoStore` client-side | Same — vendor submit not yet durable |
| Event scraper listings | `data/events.db` SQLite | Same — separate from platform DB |

---

## Build & Prisma on Vercel

| Step | Command | When |
|------|---------|------|
| Client generation | `postinstall` → `prisma generate` | Every deploy (automatic) |
| Schema apply | `npm run db:migrate:deploy` | **Manual / CI** — not in build |
| Bootstrap | `npm run db:seed-hosted` | Once after first migrate |

**Do not** run `prisma db push` on production.

---

## Migrations vs `db push`

| | Use when |
|--|----------|
| `npm run db:push` | Local experiments only |
| `npm run db:migrate:deploy` | **Production & staging** |

Initial migration: `prisma/migrations/20250628000000_init_postgres/`  
Future changes: `npx prisma migrate dev --name describe_change` → commit → `migrate deploy`.

---

## Rollback

| Action | Effect |
|--------|--------|
| Set `PILOT_DATA_SOURCE=seed` + redeploy | Instant fallback to in-memory; Neon data preserved |
| Promote prior Vercel deployment | Code rollback; set seed env if needed |
| Neon database | Untouched — safe to re-cutover later |

---

## Known DB-mode behavior differences (not bugs)

- **Booth POST** skips assignments without `applicationId` (grid/street fair should pass it from approved vendor pool).
- **Events/series labels** still read from `mockPlatformEvents` — only applications/booths/contacts are in Postgres.
- **Vendor public apply** (`/events/[id]`) still uses client demo store until wired to API.
- **Internal notes / invoice** in application drawer remain toast-only (not persisted).
- **DB bootstrap failure** downgrades to seed mode (`effectiveDataSource: seed`) with console warning.

---

## Files reference

| Purpose | Path |
|---------|------|
| Schema | `prisma/schema.prisma` |
| Initial migration | `prisma/migrations/20250628000000_init_postgres/` |
| Prisma client | `lib/prisma.ts` |
| Connectivity probe | `lib/db-status.ts` |
| Mode routing | `lib/pilot-config.ts` (`getEffectiveDataSource`) |
| Bootstrap | `scripts/seed-hosted-db.ts` |
| Health endpoint | `app/api/pilot/route.ts` |
