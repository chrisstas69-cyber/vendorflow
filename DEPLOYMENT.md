# VendorFlow deployment

## Production URL

https://vendorflow-mu.vercel.app

## Git workflow (after repo split)

| Repo | Branch | Purpose |
|------|--------|---------|
| **vendorflow** (this repo) | `main` | VendorFlow Next.js app |
| **ny-nj-event-tracker** | `main` | Personal LI/NJ event scanner (Python) — unrelated |

Push to `main` on this repo → connect Vercel **Production Branch** = `main` for auto-deploys.

Manual production deploy from local:

```bash
cd vendorflow
git checkout main
npx vercel deploy --prod
```

## Vercel environment variables

| Variable | Production value |
|----------|------------------|
| `PILOT_DATA_SOURCE` | `seed` (in-memory demo; no SQLite on serverless) |
| `PILOT_MODE` | `true` |
| `DATABASE_URL` | Optional — use Turso/Neon for persisted Prisma data |

SQLite `file:../data/platform.db` works **locally only**, not on Vercel.

## Related repo

Event scanner: https://github.com/chrisstas69-cyber/ny-nj-event-tracker
