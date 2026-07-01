# VendorFlow OS — Project Map (v3)

## Architecture

```
Public discover     →  SQLite scraper (data/events.db) + mockPlatformEvents
Organizer pilot     →  Neon Postgres (Prisma) when PILOT_DATA_SOURCE=db
Vendor logbook      →  EventDebrief + VendorFinancial + VendorReceipt (Postgres)
Vendor demo cache   →  localStorage + API sync
Auth                →  Magic link (/login) → session cookie
Payments            →  Stripe emulator OR live Stripe when STRIPE_SECRET_KEY set
```

## Screen map

| Route | Screen | Data |
|-------|--------|------|
| `/discover` | Event discovery | SQLite + platform events |
| `/events/[id]` | Event detail + apply | Apply → `POST /api/organizer/applications` |
| `/login` | Magic-link auth | `MagicLinkToken` in Postgres |
| `/pulse` | Vendor find events | Demo store (local) |
| `/calendar` | Booked events, weather, checklist, log | EventDebrief + Open-Meteo |
| `/journal` | Ledger + logbook export | VendorFinancial + EventDebrief |
| `/intelligence` | Dud risk from your history | `/api/intel/summary` |
| `/command` | Vendor paperwork pipeline | Demo store |
| `/vendor` | Passport | Prisma VendorPassport |
| `/organizer` | Dashboard pipeline | Prisma applications |
| `/organizer/applications` | Inbox + internal notes | VendorApplication |
| `/organizer/booths` | Grid + Street Fair + bulk email | BoothMap |
| `/organizer/contacts` | Ops directory | OpsOrganization |
| `/pricing` | Plan selection | `/api/subscription` |

## API highlights

| Endpoint | Purpose |
|----------|---------|
| `GET /api/pilot` | DB mode health |
| `POST /api/organizer/applications` `{ create }` | Vendor apply → inbox |
| `POST /api/auth/magic-link` | Request sign-in |
| `GET /api/auth/verify?token=` | Complete sign-in |
| `GET/POST /api/vendors/debriefs` | Event logbook |
| `GET/POST /api/vendors/financials` | Journal ledger |
| `GET/POST /api/vendors/receipts` | Receipt vault uploads |
| `GET /api/intel/summary` | Vendor intel from logbook |
| `POST /api/subscription` | Plan skeleton |
| `POST /api/payments/checkout` | Invoice pay (emulator or Stripe) |

## Legacy (API only, no UI)

- Airtable `/api/pipeline`, `/api/history` — cron engines; not used by current UI

## Repo layout

| Path | Role |
|------|------|
| `app/` | Next.js pages + API routes |
| `lib/` | Business logic, Prisma stores, pilot adapter |
| `prisma/` | Postgres schema + migrations |
| `contexts/` | React providers (auth, debrief, financials) |
| `docs/DATABASE-NEON.md` | Operator cutover guide |
