# Tracker data import

VendorFlow imports intelligence from the **LI Event Tracker** repo (`ny-nj-event-tracker`). This is an **internal/premium intelligence layer** — not polished public data.

## Architecture

```
ny-nj-event-tracker (scrape lab)
    └── data/chamber_list.csv  ──copy/sync──►  vendorflow/data/chamber_list.csv
                                                      │
                    lib/import/chamber-list.ts ◄──────┘
                    lib/import/chambers-to-ops.ts
                    lib/import/chamber-import.ts  (dry-run + commit)
                    lib/import/identity.ts        (dedupe keys)
                              │
                    /organizer/contacts  (internal view + import panel)
                    /api/ops/import
                    /api/ops/sources/health
```

**Repo separation preserved:** raw scraping stays in the tracker repo; VendorFlow consumes CSV + registry only.

## Identity & deduplication

Each organization gets:

| Field | Purpose |
|-------|---------|
| `canonicalName` | Trimmed display name |
| `normalizedDomain` | Hostname from website (no `www.`) |
| `dedupeKey` | `domain:{host}` or `name:{normalized}|{county}|{town}|{type}` |
| `sourceSystem` | `manual` \| `tracker` \| `legacy` |
| `sourcePriority` | manual=100, human_edited=90, tracker=50, legacy=40 |
| `lastImportedAt` | Last successful import timestamp |
| `lastSeenAt` | Last seen in CSV (`last_checked` column when present) |
| `importRunId` | Links to audit run |
| `manuallyEdited` | Set when organizer/internal user PATCHes org — blocks overwrite |

**Merge rule:** higher `sourcePriority` wins. Manual seed orgs beat CSV on conflict. Human-edited records are skipped unless `forceOverwriteManual` is set.

## Import workflow (recommended)

1. Sync CSV from tracker (see below)
2. Open `/organizer/contacts?view=internal`
3. Click **Dry run** — review create/update/skip/conflict counts and row preview
4. Click **Commit import** only after reviewing dry run

### API

```bash
# Dry run
curl -X POST /api/ops/import \
  -H 'Content-Type: application/json' \
  -d '{"dryRun":true,"viewerRole":"internal"}'

# Commit (after reviewing dry run)
curl -X POST /api/ops/import \
  -H 'Content-Type: application/json' \
  -d '{"dryRun":false,"viewerRole":"internal"}'
```

Import runs are stored in `ImportRun` (db mode) or in-memory (seed mode).

## Refresh CSV from tracker

```bash
cd vendorflow
git show origin/main:data/chamber_list.csv > data/chamber_list.csv
# or from ny-nj-event-tracker clone:
# cp ../ny-nj-event-tracker/data/chamber_list.csv data/chamber_list.csv
```

Then dry-run import via internal UI — **do not** rely on copy+commit alone for DB mode.

## CSV formats

**Tracker format:**

```csv
name,url,town,county,calendar_path,notes,status,last_checked,review_note
```

**Legacy VendorFlow format:**

```csv
Town,County,Chamber Name,Chamber URL,Events Page URL
```

Both parsed by `lib/import/chamber-list.ts`. `last_checked` feeds `lastSeenAt` and chamber source health.

## Source health

Internal panel at `/organizer/contacts?view=internal` shows:

- Chamber CSV row count + file modified time
- Per-source status from `lib/import/scrape-sources.ts` registry
- `chambers-csv` source uses aggregated `last_checked` from CSV

Future: tracker cron can POST scrape results to update health records.

## Scrape sources

Event site registry from tracker `registry.py` lives in `lib/import/scrape-sources.ts`. VendorFlow scrapers in `lib/scraper/` implement fetch logic separately.

## Safe future sync checklist

1. Pull latest CSV from tracker repo
2. Dry run in VendorFlow internal view
3. Resolve conflicts (manual edits, duplicate domains)
4. Commit import
5. Verify org count + spot-check 3–5 chambers
6. Log any skipped rows in outreach notes if needed

## Related repo

https://github.com/chrisstas69-cyber/ny-nj-event-tracker (branch `main`)
