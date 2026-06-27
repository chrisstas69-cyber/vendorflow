# Organizer Intelligence — Series & Applications Pipeline (Phase 1)

## Goal
Multi-event **Seasons/Series** management and a Kanban **Applications Pipeline** for organizer decision-making.

## Schema
- `EventSeries` (Prisma + `lib/platform-data.ts`) — groups event ids under a season label
- `SeriesEvent` join table in Prisma
- `OrganizerPipelineStage` — scraped | applied | reviewing | approved | waitlisted

## API
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/organizer/applications?organizerId=&seriesId=&eventId=` | Pipeline inbox + counts |
| POST | `/api/organizer/applications` | `{ submissionId, action }` — accept, waitlist, request_info, reject |

## UI
- `/organizer` — Kanban board (Scraped → Applied → Reviewing → Approved) + series filter
- `/organizer/applications` — full list with Decision Panel match scores
- `useOrganizerInbox` hook — fetches inbox + performs actions

## Demo data
- Canonical organizer: `org-demo` (`DEMO_ORGANIZER_ID`)
- All seeded demo events (except claimable `evt-003`) owned by `org-demo`
- 6 mock submissions across pipeline stages

## Phase 2
- Sync inbox with Prisma application rows
- Drag-and-drop Kanban
