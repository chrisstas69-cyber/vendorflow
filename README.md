# VendorFlow OS

Event vendor intelligence for NY/NJ street fair operators — discovery, pipeline, deadlines, and profit tracking.

> **Repository:** This repo is **VendorFlow only**. The separate NY/NJ event scanner lives in [`ny-nj-event-tracker`](https://github.com/chrisstas69-cyber/ny-nj-event-tracker) on branch `main`.

**Production:** https://vendorflow-mu.vercel.app

## Quick start

```bash
cd ~/Desktop/vendorflow
npm install
npm run dev
```

Open **http://localhost:3002**

## Setup (required)

1. Go to **http://localhost:3002/setup**
2. Add **Airtable PAT** (starts with `pat`) and **Base ID** (starts with `app`)
3. Run schema setup:

```bash
npm run airtable:setup
npm run airtable:verify
```

4. In Airtable, add automation: daily 8 AM → paste `airtable/file3_airtable_deadline_engine.js`

See `airtable/AIRTABLE-SETUP.md` for full instructions.

## Screens

| Route | Purpose |
|-------|---------|
| `/` | Event Pulse — scraped events, add to pipeline |
| `/intelligence` | Graded leads (S/A/B/C) |
| `/command` | Deadline queue |
| `/calendar` | This week's events |
| `/journal` | Post-event profit log |
| `/events/scrape` | Run scrapers |

## Optional

Google Sheets + email digest — configure at `/setup` when ready.

## Deploy (Vercel)

Set env vars: `AIRTABLE_PAT`, `AIRTABLE_BASE_ID`, `CRON_SECRET`

Cron jobs: scrape 6 AM, engines 8 AM (see `vercel.json`).

## Project map

See `PROJECT-MAP.md`
