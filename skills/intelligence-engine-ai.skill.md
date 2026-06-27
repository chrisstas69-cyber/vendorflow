# Intelligence Engine — AI Matching & Assistants (Phase 1)

## Goal
Cache background AI recommendations (match scores, compliance alerts, revenue forecasts, assistant replies) so UI components fetch instantly without re-running models on every page load.

## Prisma models (`prisma/schema.prisma`)
| Model | Purpose |
|-------|---------|
| `VendorPassport` | Persistent vendor profile — compliance, trailers, service tags |
| `VendorDocument` | COI, W-9, permits with review status + expiry |
| `EventSeries` | Recurring fair / market seasons grouping platform events |
| `SeriesEvent` | Join table linking series ↔ event ids |
| `AIInsight` | Cached recommendation payloads keyed by scope |

### VendorPassport (DB-backed fields)
- Document compliance: `validationState`, `complianceScore`, `insuranceExpiry`
- Trailers / logistics: `vehicleType`, `trailerLengthFt`, booth dims, power, setup time
- Tags: `categories`, `serviceTags` (JSON arrays)

### EventSeries fields
- `slug`, `name`, `description`, `organizerId`, `seasonLabel`, `coverImageUrl`
- `events` via `SeriesEvent` join rows

### AIInsight fields
- `scopeType`: `vendor` \| `event` \| `series` \| `organizer` \| `match`
- `scopeId`: entity id or composite key
- `insightType`: `match_recommendation` \| `revenue_forecast` \| `compliance_alert` \| `assistant_reply` \| `risk_score`
- `title`, `summary`, `payload` (JSON), `modelVersion`, `confidence`
- `status`: `active` \| `dismissed` \| `expired`
- `expiresAt` for TTL cache invalidation

## API (scaffolded — no business logic yet)
| Method | Route | Purpose |
|--------|-------|---------|
| GET, POST | `/api/ai/insights` | List / store cached insights |
| GET | `/api/ai/matching` | Vendor ↔ event match recommendations |
| POST | `/api/ai/assistant` | Conversational assistant (streaming later) |
| GET, POST | `/api/organizer/series` | List / create event series |
| GET, PATCH | `/api/organizer/series/[seriesId]` | Read / update series |

## Phase 2
- Nightly cron to refresh `AIInsight` rows (`/api/cron/engines`)
- Vector embeddings for passport ↔ event matching
- Wire `/intelligence` UI to live insight feed
