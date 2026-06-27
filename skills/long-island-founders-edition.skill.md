# Long Island Founders Edition (Pilot)

## Goal
Hyper-local Nassau & Suffolk compliance, premium onboarding, and in-flow document checks.

## Data (`lib/long-island/`)
- `compliance-rules.ts` — NYS Certificate of Authority, health permits, fire marshal, parks auth
- `compliance-check.ts` — runs against VendorPassport + event region/category
- `seed.ts` — persists rules to `ComplianceRule` Prisma table

## Sales tax
Nassau/Suffolk combined rate stored as `salesTaxRateBps: 8625` (8.625%)

## UI
- `FoundersEditionBanner` — premium gradient on vendor passport, assistants, event apply
- `LocalComplianceAlert` — missing local docs in vendor application modal

## Seeded rules
| ID | Region | Document |
|----|--------|----------|
| li-nassau-coa | Nassau | NYS Certificate of Authority |
| li-suffolk-coa | Suffolk | NYS Certificate of Authority |
| li-nassau-health | Nassau | Temporary Food Permit |
| li-suffolk-health | Suffolk | Mobile Food Unit Permit |
| li-nassau-fire | Nassau | Tent/Canopy Permit |
| li-suffolk-park | Suffolk | Parks Vendor Authorization |

## Phase 3
- County-specific application PDF templates
- Auto-fetch permit status from county APIs
