# Vendor Intelligence — Vendor Passport (Phase 1)

## Goal
Single **Vendor Passport** profile reused across all event applications — business metadata, logistics/tags, documents, and match-ready validation.

## Schema
### TypeScript (`lib/vendor-passport.ts`)
- `VendorPassport` — businessName, contact, categories, serviceTags, logistics, documents, setupPhotoUrl
- `PassportValidationState` — `incomplete` | `documents_pending` | `needs_review` | `ready_for_matching`
- `validatePassport()` — scoring + missing field/doc detection

### Prisma (`prisma/schema.prisma`)
- `VendorPassport` — persisted mirror with compliance fields for payments + intelligence systems
- `VendorDocument` — COI, W-9, permits with review status
- Sync layer: `lib/vendor-passport-db.ts` (API writes to memory + SQLite platform DB)

## API
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/vendors/passport?vendorEmail=` | Read passport + validation |
| POST | `/api/vendors/passport` | Create or `{ sync: true, passport }` from client |
| PUT | `/api/vendors/passport` | Partial update |
| DELETE | `/api/vendors/passport?vendorEmail=` | Delete (not demo) |
| GET | `/api/vendors/passport/validate` | Validation state only |

## UI
- `/vendor` — multi-tab dashboard (General, Logistics & Tags, Document center, Invoicing)
- `contexts/vendor-passport-context.tsx` — localStorage + API sync
- Demo vendor: `vendor@demo.vendorflow.app`

## Phase 2
- Real file upload to blob storage
- Auto-fill apply form from passport on `/events/[id]`
