# GameSession and combat

## Purpose

This document places **GameSession** (live-play session container) in the same mental model as [architecture.md](./architecture.md) and [ownership-boundaries.md](./ownership-boundaries.md). It is **not** a full product spec; it records how the implemented shell relates to **combat** specifically.

## What GameSession is

**GameSession** is the campaign-scoped **player-facing live-play container** for a table session: scheduling, lobby, setup, and (eventually) encounters inside that session. It lives under `src/features/game-session` and is **distinct from**:

- **Encounter Simulator** (`src/features/encounter`) — dev/testing combat workflow, single operator.
- **Calendar “Sessions”** (`/sessions`) — a different product surface.
- **Persisted combat sessions** (server `combat` API / Mongo combat documents) — authoritative **encounter** state and `revision`; see [server/authoritative-flow.md](./server/authoritative-flow.md).

## What exists today (summary)

- **Routes:** campaign game session list, per-session **Lobby** and **Setup** (e.g. `/campaigns/:campaignId/game-sessions/:gameSessionId/lobby`).
- **Lifecycle status** (authoritative on the game session record): `draft`, `scheduled`, `lobby`, `active`, `completed`, `cancelled`.
- **Scheduling:** `scheduledFor` is **planning/display metadata** only; it does **not** auto-open the lobby. The DM moves the session to **lobby** with an explicit action (e.g. “Open now”).
- **Lobby (first pass):** expected party from the **campaign roster** (placeholder seam for stricter “expected participants” later), **Socket.IO** ephemeral presence in the lobby room (`presentUserIds`), **not** persisted on the game session document as durable membership.
- **Combat:** launching or binding an **encounter** to a game session, and driving **server-authoritative combat** from the lobby, are **not** implemented in this shell yet. The Encounter Simulator remains the primary surface for combat mechanics integration until GameSession wires those seams.

## Ownership relative to combat

| Concern | Owner |
|--------|--------|
| Combat truth, intents, `EncounterState` | Shared mechanics + server combat application (when used) |
| Encounter Simulator workflow | `src/features/encounter` |
| Game session **document**, lifecycle, lobby/setup UI, lobby presence transport | `src/features/game-session` |
| Calendar sessions | Separate feature |

GameSession **must not** own combat rules or canonical encounter state; it may **orchestrate** navigation and future “start encounter” actions that **call** the same combat APIs the simulator can use.

## Socket.IO note

Lobby presence uses Socket.IO for **who is in the lobby** (session-scoped). That is **separate** from any future **combat** realtime channel (authoritative state broadcast after intents), which is still described as outstanding work in [roadmap.md](./roadmap.md).

## Where to read more in-repo

- Game session types and API: `src/features/game-session/`
- Combat architecture (layers): [architecture.md](./architecture.md)
- Where code belongs: [ownership-boundaries.md](./ownership-boundaries.md)
