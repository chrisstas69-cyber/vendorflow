# VendorFlow OS — Setup Guide

## Quick Start

1. **Create your Airtable table** named `Events` with these fields:

| Field Name | Type | Notes |
|---|---|---|
| Event Name | Single line text | |
| Application Deadline | Date | |
| Booth Fee | Currency | |
| Actual Sales | Currency | |
| Miles | Number | Round-trip mileage |
| Alpha Score | Number | Income ÷ Family Density (0–100) |
| Vibe Check | Number | Your gut rating (1–10) |
| Net Take-Home | Number | *Computed by script* |
| Deadline Alert Tier | Single select | Options: `🔴 30-Day`, `🟡 60-Day`, `🟢 90-Day` |
| Event Tier | Single select | Options: `S-Tier`, `A-Tier`, `B-Tier`, `Dud` |
| Last Scored | Date | *Set by script* |

2. **Install the script:** Open Extensions → Scripting → paste the entire `.js` file.

3. **Run it:** Click "Run" — it defaults to `full` mode (all engines).

---

## Automation Setup (Scheduled Triggers)

Create up to 3 automations in Airtable for hands-free operation:

| Automation | Trigger | Script Input |
|---|---|---|
| Daily Deadline Check | Scheduled — every day 8 AM | `{ "mode": "alerts" }` |
| Post-Event Financials | When `Actual Sales` is updated | `{ "mode": "finance" }` |
| Weekly Scoring | Scheduled — every Monday | `{ "mode": "scoring" }` |

In each automation, add a **"Run a script"** action, paste the full script, and set the **Input Variables** to include `mode` with the appropriate value.

---

## Tuning the Dud-Risk Algorithm

Edit the `CONFIG.scoring` block in the script:

```
alphaWeight: 0.60   →  Market data influence (raise if you trust the numbers)
vibeWeight:  0.40   →  Gut feeling influence (raise if you trust your instincts)
sThreshold:  80     →  Minimum composite score for S-Tier
aThreshold:  60     →  Minimum for A-Tier
bThreshold:  40     →  Minimum for B-Tier (below = Dud)
```

Both weights should sum to **1.0**.

---

## Figma Integration Notes

The script writes all computed values directly to Airtable fields. Your Figma prototype can pull live data via the Airtable API or a plugin like **Airtable → Figma Sync**. Key fields to bind:

- `Deadline Alert Tier` → color-coded badge component
- `Net Take-Home` → financial cards
- `Event Tier` → tier badge / ranking list
- `Last Scored` → "freshness" indicator
