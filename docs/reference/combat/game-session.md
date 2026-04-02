# GameSession and combat

## Purpose

This document places **GameSession** (live-play session container) in the same mental model as [architecture.md](./architecture.md) and [ownership-boundaries.md](./ownership-boundaries.md). It is **not** a full product spec; it records how the implemented shell relates to **combat** specifically.

## What GameSession is

**GameSession** is the campaign-scoped **player-facing live-play container** for a table session: scheduling, lobby, setup, **session play**, and lifecycle. It lives under `src/features/game-session` and is **distinct from**:

- **Encounter Simulator** (`src/features/encounter`) — dev/testing combat workflow, single operator, simulator-only chrome (e.g. POV switcher, edit/reset in the active header).
- **Calendar “Sessions”** (`/sessions`) — a different product surface.
- **Persisted combat sessions** (server `combat` API / Mongo combat documents) — authoritative **encounter** state and `revision`; see [server/authoritative-flow.md](./server/authoritative-flow.md).

## What exists today (summary)

- **Routes:** campaign game session list, per-session **Lobby**, **Setup**, and **`/play`** (e.g. `/campaigns/:campaignId/game-sessions/:gameSessionId/play` — exact path follows the app router).
- **Lifecycle status** (authoritative on the game session record): `draft`, `scheduled`, `lobby`, `active`, `completed`, `cancelled`.
- **Scheduling:** `scheduledFor` is **planning/display metadata** only; it does **not** auto-open the lobby. The DM moves the session to **lobby** with an explicit action (e.g. “Open now”).
- **Lobby (first pass):** expected party from the **campaign roster** (placeholder seam for stricter “expected participants” later), **Socket.IO** ephemeral presence in the lobby room (`presentUserIds`), **not** persisted on the game session document as durable membership.
- **Starting a session / combat linkage:** when a session becomes **active** and combat is started from the table flow, the game session record can carry **`activeEncounterId`** — the **`sessionId`** of the **persisted combat session** document (same id space as `GET/POST /api/combat/sessions/...`). That id is how **`/play`** knows which authoritative encounter to load.
- **Session play (`/play`):** loads the persisted combat snapshot via **`GET /api/combat/sessions/:sessionId`**, hydrates local encounter state, and renders the shared **active combat shell** (**`CombatPlayView`**) — grid, sidebar, drawers, action flow — using the same surface as the Encounter Simulator active route (`useEncounterActivePlaySurface`). Successful local **`applyCombatIntent`** calls are **mirrored** to **`POST /api/combat/sessions/:sessionId/intents`** with **`baseRevision`** so the server stays authoritative (stale revision → **409**; client handling of conflicts is still basic — see [roadmap.md](./roadmap.md)).
- **Encounter Simulator** remains a **separate** top-level workflow: it uses **`EncounterRuntimeProvider`** and local roster/setup; it does **not** use the GameSession container. Both paths can render the same **`CombatPlayView`** shell; simulator-only presentation state (viewer mode, etc.) stays in the simulator feature.

## Shared active play shell

- **`CombatPlayView`** (`src/features/combat/components/CombatPlayView.tsx`): layout shell for header slot, grid area, sidebar, drawers, toasts, game-over modal slot.
- **`useEncounterActivePlaySurface`** (`src/features/encounter/hooks/useEncounterActivePlaySurface.tsx`): wires encounter runtime inputs into **`CombatPlayView`** (interaction handlers, grid, drawers). Used by the simulator active route and by **`GameSessionEncounterPlaySurface`**.
- **`useEncounterCombatActiveHeader`**: shared header model for **`EncounterActiveHeader`**; **session** variant hides simulator-only toolbar (POV switcher, edit/reset).

GameSession **does not** embed the Encounter Simulator provider; it **orchestrates** session fetch, hydration, and passes deps into the shared hook.

## Ownership relative to combat

| Concern | Owner |
|--------|--------|
| Combat truth, intents, `EncounterState` | Shared mechanics + server combat application (when used) |
| Encounter Simulator workflow | `src/features/encounter` |
| Reusable active play **layout** shell | `src/features/combat` (`CombatPlayView`) + encounter hooks (`useEncounterActivePlaySurface`, etc.) |
| Game session **document**, lifecycle, lobby/setup/play **orchestration**, `activeEncounterId` reference | `src/features/game-session` |
| Calendar sessions | Separate feature |

GameSession **must not** own combat rules or canonical encounter state; it **orchestrates** loading, revision sync, and navigation while **calling** the same mechanics and HTTP seams as other clients.

## Socket.IO note

Lobby presence uses Socket.IO for **who is in the lobby** (session-scoped). That is **separate** from any future **combat** realtime channel (authoritative state broadcast after intents), which is still described as outstanding work in [roadmap.md](./roadmap.md).

## Where to read more in-repo

- Game session types and API: `src/features/game-session/`
- Persisted combat client API: `src/features/combat/api/combatSessionApi.ts`
- Combat architecture (layers): [architecture.md](./architecture.md)
- Where code belongs: [ownership-boundaries.md](./ownership-boundaries.md)
