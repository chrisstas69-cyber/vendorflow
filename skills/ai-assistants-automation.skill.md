# AI Assistants & Automation (Phase 2)

## Goal
Interactive chat for organizers and vendors with safe context assembly and one-click quick actions.

## Routes
- `/organizer/assistant` — series, vendor pools, permit deadlines
- `/vendor/assistant` — events, compliance, applications

## Context (`lib/assistant/context-assembler.ts`)
Assembles role-specific platform state into a sanitized JSON prompt block.

## Quick actions (`lib/assistant/quick-actions.ts`)
Parses assistant replies for keywords → instantiates:
- Call sheet → `/organizer/command`
- Application template → `/organizer/applications` or `/pulse`
- Invoice draft → invoicing tab
- Event series → `/organizer/events`

## API
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/ai/assistant` | Chat with context + quick actions |

## Phase 3
- Streaming SSE responses
- Tool-use for creating real invoice rows from chat
