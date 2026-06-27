# Welcome Back — VendorFlow OS

Your app is built and running at **http://localhost:3002**

## Done while you were away

- Unified repo at `~/Desktop/vendorflow` (scrapers + Airtable + Figma UI)
- 5 screens: Event Pulse, Intel, Command, Calendar, Journal
- Pipeline API (SQLite → Airtable)
- Profit engine in Financial Journal
- Setup page at `/setup` with validation
- Production build passes
- Dev server on port **3002**

## One fix needed (5 minutes)

Your Airtable credentials are saved but **incorrect format** — both start with `AIRT` instead of:
- Token → `pat...`
- Base ID → `app...`

### Fix steps

1. Open **http://localhost:3002/setup**
2. Re-paste **only the values** (not the field names)
3. Click Save
4. In Terminal:

```bash
cd ~/Desktop/vendorflow
npm run airtable:setup
npm run airtable:verify
```

## Then try the full loop

1. **http://localhost:3002/events/scrape** → Scrape All
2. **/** → click **PIPELINE** on events you want
3. **/command** → set Application Deadline in Airtable for deadline alerts
4. **/journal** → log post-event sales

## Optional later

- Google Sheets + email at `/setup`
- Airtable automation: paste `airtable/file3_airtable_deadline_engine.js` (daily 8 AM)

## Docs

- `README.md` — quick start
- `PROJECT-MAP.md` — architecture
- `airtable/AIRTABLE-SETUP.md` — Airtable details
