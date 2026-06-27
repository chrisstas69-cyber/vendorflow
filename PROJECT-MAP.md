# VendorFlow OS — Project Map

## Repos (unified here)

| Path | Role |
|------|------|
| `app/` | Next.js UI + API routes |
| `lib/scraper/` | 28 NY/NJ event scrapers |
| `lib/db.ts` | SQLite event store |
| `lib/airtable.ts` | Airtable REST client |
| `airtable/` | File 3/4 scripts + FIELD_CONTRACT |

## External references

- **NotebookLM:** [VendorFlow OS doctrine](https://notebooklm.google.com/notebook/f460b011-4aaa-4e57-b8d1-7d2661a94d28)
- **Figma Make:** [Build VendorFlow OS v2](https://www.figma.com/make/e5a0Y0ayLc6Th6M3exIC6M/Build-VendorFlow-OS-v2)

## Screen map

| Route | Screen | Data source |
|-------|--------|-------------|
| `/` | Event Pulse | SQLite `events` |
| `/intelligence` | Vendor Intelligence | Airtable `Event_Leads` |
| `/command` | Command Center | Airtable `Event_Leads` |
| `/calendar` | Calendar Ops | SQLite week view |
| `/journal` | Financial Journal | Airtable `Event_History` |
| `/events/scrape` | Run scrapers | SQLite |
| `/setup` | API keys | `.env.local` |

## Airtable setup

```bash
npm run airtable:setup   # creates tables if base is empty
npm run airtable:verify  # checks schema + connection
```
