# VendorFlow OS — Shared Field Contract

> **This is the single source of truth.** Both File 3 (JS) and File 4 (Python)
> reference these exact field names. If you rename a field in Airtable,
> update it in both files.

## Event_Leads

| Field Name              | Type          | Written By    | Notes                                   |
|-------------------------|---------------|---------------|-----------------------------------------|
| `Event Name`            | Text          | You           | Primary identifier                      |
| `Application Deadline`  | Date          | You           | → Drives File 3 Deadline Engine         |
| `Status`                | Single select | You           | Your pipeline status                    |
| `Alert Level`           | Single select | **File 3 JS** | Options: `🔴 URGENT`, `🟡 WARNING`, `🟢 HEADS UP` |
| `Needs Action`          | Checkbox      | **File 3 JS** | True when deadline is within 90 days    |
| `Family Density`        | Number        | You           | Percentage (e.g. 45 = 45%)             |
| `Alpha Score`           | Number        | You           | 0–100 composite market score            |
| `Event Grade`           | Single select | **File 4 PY** | Options: `S`, `A`, `B`, `C`            |
| `ZIP`                   | Number/Text   | You           | Event location ZIP code                |
| `S-Tier Priority`       | Checkbox      | **File 4 PY** | True when ZIP is 11730 or 11784        |

## Event_History

| Field Name              | Type          | Written By    | Notes                                   |
|-------------------------|---------------|---------------|-----------------------------------------|
| `Event Name`            | Text / Link   | You           | Matches or links to Event_Leads         |
| `Actual Sales`          | Currency      | You           | Post-event revenue                      |
| `Booth Fee`             | Currency      | You           | Vendor fee paid                         |
| `Miles`                 | Number        | You           | Round-trip mileage                      |
| `Net Take-Home`         | Number        | **File 4 PY** | **Formula:** `Actual_Sales - Booth_Fee - (Miles × $0.67)` |
| `Profitable`            | Checkbox      | **File 4 PY** | True when Net > $0                      |

## Data Flow

```
┌─────────────┐         ┌──────────────────────────────────────────┐
│  YOU (data)  │────────▶│          AIRTABLE TABLES                 │
└─────────────┘         │                                          │
                        │  Event_Leads      Event_History          │
                        │  ┌────────────┐   ┌─────────────────┐   │
                        │  │ Deadline   │   │ Sales, Fee,     │   │
                        │  │ Density    │   │ Miles           │   │
                        │  │ Alpha      │   │                 │   │
                        │  └─────┬──────┘   └───────┬─────────┘   │
                        └────────┼──────────────────┼──────────────┘
                                 │                  │
                    ┌────────────┘                  └───────────────┐
                    ▼                                               ▼
        ┌───────────────────────┐               ┌──────────────────────────┐
        │  FILE 3 — JavaScript  │               │  FILE 4 — Python         │
        │  Airtable Automation  │               │  Cursor / CLI / Cron     │
        │                       │               │                          │
        │  ► Alert Level        │               │  ► Event Grade (S/A/B/C) │
        │  ► Needs Action flag  │               │  ► Net Take-Home         │
        │                       │               │  ► Profitable flag       │
        └───────────────────────┘               └──────────────────────────┘
```

## Automation Wiring

| What                  | Where                        | Trigger                          | Mode / Input         |
|-----------------------|------------------------------|----------------------------------|----------------------|
| Deadline alerts       | Airtable Automation (File 3) or File 4 | Scheduled daily 8 AM             | `recordId` (optional)|
| Deadline refresh      | Terminal / cron (File 4)     | `python file4_vendorflow_engine.py --mode deadlines` | |
| Grading refresh       | Terminal / cron (File 4)     | `python file4_vendorflow_engine.py --mode grading`  | |
| Profit recalculation  | Terminal / cron (File 4)     | `python file4_vendorflow_engine.py --mode profits`  | |
| Full sweep            | Terminal / cron (File 4)     | `python file4_vendorflow_engine.py`                 | |

## Schema Setup (Manual)

Before running the Python engines, add these columns to **Event_Leads** in Airtable (if not present):

- `ZIP` — Number or Text (event location ZIP code)
- `S-Tier Priority` — Checkbox (written by File 4 when ZIP is 11730 or 11784)

## Python Setup (File 4)

```bash
pip install pyairtable python-dotenv
```

`.env` file:
```
AIRTABLE_PAT=patXXXXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
```
