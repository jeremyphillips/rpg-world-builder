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
- **Session play (`/play`):** loads the persisted combat snapshot via **`GET /api/combat/sessions/:sessionId`**, hydrates local encounter state, and renders the shared **active combat shell** (**`CombatPlayView`**) — grid, sidebar, drawers, action flow — using the same surface as the Encounter Simulator active route (`useEncounterActivePlaySurface`). Successful local **`applyCombatIntent`** calls are **mirrored** to **`POST /api/combat/sessions/:sessionId/intents`** with **`baseRevision`** so the server stays authoritative (stale revision → **409**). The client **serializes** those POSTs so each uses the revision returned by the previous commit (avoiding spurious **409** from overlapping requests), **slims** JSON context (e.g. drops **`monstersById`**) to keep bodies under server limits, and keeps encounter state in a **render-synced ref** for handlers — see [client/persisted-intent-sync.md](./client/persisted-intent-sync.md). Product-level **409** recovery (refetch/retry) remains basic — [roadmap.md](./roadmap.md).
- **Who can act (viewer seat):** **`/play`** resolves **DM / player / observer** and **controlled combatant ids** before **`deriveEncounterCapabilities`** (movement, end turn, etc.). **`GameSession.participants`** is not always populated for every player; the resolver may **infer** a controlling **player** seat from **campaign roster** (`ownerUserId`) and **party `source.kind === 'pc'`** combatants in the loaded **`EncounterState`**. The server apply-intent path uses the **same** inference when a game session is linked so UI and **403** enforcement stay aligned — see [client/encounter-viewer-permissions.md](./client/encounter-viewer-permissions.md).
- **Encounter Simulator** remains a **separate** top-level workflow: it uses **`EncounterRuntimeProvider`** and local roster/setup; it does **not** use the GameSession container. Both paths can render the same **`CombatPlayView`** shell; simulator-only presentation state (viewer mode, etc.) stays in the simulator feature.

## Shared active play shell

- **`CombatPlayView`** (`src/features/combat/components/CombatPlayView.tsx`): layout shell for header slot, grid area, sidebar, drawers, toasts, game-over modal slot.
- **`useEncounterActivePlaySurface`** (`src/features/encounter/hooks/useEncounterActivePlaySurface.tsx`): wires encounter runtime inputs into **`CombatPlayView`** (interaction handlers, grid, drawers). Used by the simulator active route and by **`GameSessionEncounterPlaySurface`**. Action-resolved **toasts** are **viewer-aware** (neutral log payload → relationship + policy → `AppToast`); dedupe and optional queue are documented in [client/local-dispatch.md](./client/local-dispatch.md#encounter-toasts-viewer-aware).
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

## Session shell vs canonical phase

`GameSessionLayout` (shell) loads the session record, owns **`GameSessionSyncProvider`**, and wraps **lobby, setup, and play** so socket invalidation arrives **before** `/play` mounts — enabling lobby→play when the DM starts an encounter and future play→lobby when `activeEncounterId` clears. **Canonical phase** for routing is derived in one place (`deriveGameSessionCanonicalPhase` in `src/features/game-session/utils/`): **`play`** when `status === 'active'` and `activeEncounterId` is set; otherwise **`lobby`** (meaning “not in encounter play,” including **setup** routes — naming matches product language). Child routes stay presentation-focused; they use `Navigate` against that phase after refetch.

**Play surface** (`GameSessionEncounterPlaySurface`) may add **play-level** handling (e.g. refetch persisted combat when `combatRevision` advances) without bloating the layout subscription.

## Socket.IO note

Two session-scoped channels (both authenticated via the same client socket from `SocketConnectionProvider`):

- **Lobby presence** — `join_game_session_lobby` / `game_session_lobby_presence`: ephemeral **who is in the lobby** (`presentUserIds`). Not durable membership on the game session document.
- **Session sync** — `join_game_session_sync` / `game_session_sync`: **invalidation hints** when canonical state changes. Payload includes `sessionRowChanged` (game session document: status, `activeEncounterId`, etc.) and optional `combatSessionId` + `combatRevision` after a successful persisted intent. Clients **refetch** `GET` game session and/or `GET` persisted combat — they do not treat the socket payload as authoritative state. Lobby **`/play`** routing and play **turn** updates both follow from refreshed HTTP data. Implementation: `server/socket.ts` (`emitGameSessionSync`), `GameSessionSyncProvider` + `GameSessionLayout`.

Finer-grained UX (e.g. 409 retry polish, server-side catalog injection) may still be tracked in [roadmap.md](./roadmap.md).

## Where to read more in-repo

- Game session types and API: `src/features/game-session/`
- Persisted combat client API: `src/features/combat/api/combatSessionApi.ts`
- Combat architecture (layers): [architecture.md](./architecture.md)
- Where code belongs: [ownership-boundaries.md](./ownership-boundaries.md)
