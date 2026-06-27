# Airtable Setup for VendorFlow OS

## 1. Credentials

Add at **http://localhost:3002/setup**:

- `AIRTABLE_PAT` — from [airtable.com/create/tokens](https://airtable.com/create/tokens)
  - Scopes: `schema.bases:read`, `schema.bases:write`, `data.records:read`, `data.records:write`
- `AIRTABLE_BASE_ID` — from URL `airtable.com/appXXXXXX/...`

## 2. Automated schema

```bash
npm run airtable:setup
npm run airtable:verify
```

Creates or patches:

**Event_Leads** — Event Name, Application Deadline, Event Date, Status, Alert Level, Needs Action, Family Density, Alpha Score, Event Grade, ZIP, S-Tier Priority, Location, Source URL, Scraper Source, SQLite Event ID

**Event_History** — Event Name, Actual Sales, Booth Fee, Miles, Net Take-Home, Profitable

## 3. Deadline automation (manual, ~10 min)

1. Open your base in Airtable
2. **Automations** → Create automation
3. Trigger: **Scheduled** → Daily at 8:00 AM
4. Action: **Run script**
5. Paste entire contents of `airtable/file3_airtable_deadline_engine.js`
6. Turn on automation

## 4. Python engine (optional cron)

```bash
cd airtable
pip install pyairtable python-dotenv
# Copy AIRTABLE_* from ../.env.local to airtable/.env
python file4_vendorflow_engine.py --mode all
```

Or use the built-in cron: `POST /api/cron/engines` with `Authorization: Bearer $CRON_SECRET`

## Field contract

Single source of truth: `airtable/FIELD_CONTRACT.md`
