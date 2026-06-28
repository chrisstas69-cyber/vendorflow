# VendorFlow deployment

## Production URL

https://vendorflow-mu.vercel.app

## Git workflow

| Repo | Branch | Purpose |
|------|--------|---------|
| **vendorflow** | `main` | VendorFlow Next.js app |
| **ny-nj-event-tracker** | `main` | LI/NJ event scanner (Python) — separate |

```bash
git push vendorflow main
npx vercel deploy --prod
```

## Vercel environment variables (production)

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon **pooled** Postgres URL |
| `DIRECT_URL` | Neon **direct** URL (migrations) |
| `PILOT_DATA_SOURCE` | `db` |
| `PILOT_MODE` | `true` |

Full setup: **[docs/DATABASE-NEON.md](./docs/DATABASE-NEON.md)**

## First-time hosted DB setup

```bash
npm run db:migrate:deploy
PILOT_DATA_SOURCE=db npm run db:seed-hosted
```

Then set Vercel env vars and deploy.

## Rollback

- Promote previous Vercel deployment, or
- Set `PILOT_DATA_SOURCE=seed` (instant fallback to in-memory)

## Related

- Chamber import: [docs/TRACKER-IMPORT.md](./docs/TRACKER-IMPORT.md)
- Event scanner: https://github.com/chrisstas69-cyber/ny-nj-event-tracker
