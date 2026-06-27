# Intelligence Engine — Deterministic Matching (Phase 2)

## Goal
Rule-based vendor ↔ event compatibility scores before AI enhancement.

## Matching utility (`lib/intel/matching.ts`)
Scores on:
- Category caps / slot availability
- Booth footprint & trailer limits
- Insurance / COI compliance
- Required document checklist
- Geographic radius (haversine from region centroid)

## API
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/intel/match?vendorEmail=&eventId=` | Rule-based score + breakdown |
| GET | `/api/intel/match?...&ai=1` | Merged rule + Claude cache |

## UI
- `VendorDecisionPanel` on `/organizer/applications` — shows % match + rule lines + AI accordion

## Phase 3
- Weight tuning per event category
- Custom geo coordinates per event row
