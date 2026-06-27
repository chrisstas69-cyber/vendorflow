# Marketplace Intelligence — Public Discovery (Phase 1)

## Goal
Unified attendee discovery powered by SQLite event index + platform listings merge.

## API
`GET /api/events/list?view=discover&format=marketplace`

| Param | Purpose |
|-------|---------|
| `q` | Full-text search |
| `regionSlug` | long-island, nj, nyc |
| `town` | Town slug (hoboken, westbury) |
| `state` | NY \| NJ |
| `tags` | Comma-separated experience tag ids |
| `includePlatform` | 0 to disable demo platform merge |

## Experience tags (`lib/marketplace.ts`)
kids-zone, food-trucks, free-parking, live-music, fireworks, outdoor, indoor, free-event

## Routes
- `/discover` — main search UI
- `/discover/[region]/[town]` — SEO regional landing pages
- `/discover/event/[eventId]` — scraped event detail

## Components
- `EventListingCard` — unified card (platform + sqlite)
- `DiscoverExplore` — search UI with tag chips
- `PublicEventCard` — thin wrapper for legacy imports

## Phase 2
- Persist experience_tags column in SQLite on scrape
- Geo bounding box search
- Saved events / interested
