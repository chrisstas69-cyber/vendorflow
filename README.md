# VendorFlow OS

Three-sided marketplace for Long Island street fairs — **organizer pilot** (Neon Postgres) + **vendor hub** (logbook, journal, intel).

**Production:** https://vendorflow-mu.vercel.app  
**Repo:** [`vendorflow`](https://github.com/chrisstas69-cyber/vendorflow)  
**Event scraper (separate):** [`ny-nj-event-tracker`](https://github.com/chrisstas69-cyber/ny-nj-event-tracker)

## Quick start

```bash
cd ~/Desktop/vendorflow
npm install
npm run dev
```

Open **http://localhost:3002**

## Environment (production)

See `docs/DATABASE-NEON.md` for Neon cutover. Key vars:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` / `DIRECT_URL` | Neon Postgres |
| `PILOT_DATA_SOURCE=db` | Durable organizer + vendor logbook data |
| `AUTH_SECRET` | Magic-link session signing |
| `RESEND_API_KEY` + `RESEND_FROM` | Email magic links (optional — dev shows link on screen) |
| `STRIPE_SECRET_KEY` | Live checkout (optional — emulator without it) |
| `CLAUDE_API_KEY` | AI assistant + intel |

## Main routes

| Audience | Routes |
|----------|--------|
| **Public** | `/discover`, `/events/[id]`, `/pricing`, `/login` |
| **Vendor** | `/pulse`, `/calendar`, `/journal`, `/intelligence`, `/command`, `/vendor` |
| **Organizer** | `/organizer`, `/organizer/applications`, `/organizer/booths`, `/organizer/contacts` |

## Health check

`GET /api/pilot` — shows `effectiveDataSource` (`seed` vs `db`).

## Deploy

Vercel runs `scripts/vercel-build.mjs` (migrate + build). Push to `main` to deploy.

## Docs

- `PROJECT-MAP.md` — architecture map  
- `docs/DATABASE-NEON.md` — Postgres pilot  
- `DEPLOYMENT.md` — Vercel env
