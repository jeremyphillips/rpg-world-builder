# Combat reference (authoritative index)

This directory is the **canonical documentation** for combat **architecture**, **ownership**, **terminology**, and **direction**. It is not only a refactor checklist: treat these docs as the source of truth for *why* the system is shaped this way and *where* new work belongs.

## What this doc set is for

- **Philosophy and boundaries:** who owns truth vs workflow vs transport (see [architecture.md](./architecture.md), [ownership-boundaries.md](./ownership-boundaries.md)).
- **Stable vocabulary:** [glossary.md](./glossary.md).
- **Mechanics contract:** public API and import policy — [adr-shared-combat-extraction.md](./adr-shared-combat-extraction.md).
- **Execution reality:** what is shipped, what is next, and **known gaps** — [roadmap.md](./roadmap.md).

The [roadmap](./roadmap.md) is the living tracker for milestones, outstanding work, and shortcomings. Older filename **`migration-roadmap.md`** redirects there so bookmarks keep working.

## Reading order (recommended)

1. [architecture.md](./architecture.md) — layers, data flow, success criteria  
2. [ownership-boundaries.md](./ownership-boundaries.md) — decision guide for where code goes  
3. [glossary.md](./glossary.md) — shared terms  
4. [adr-shared-combat-extraction.md](./adr-shared-combat-extraction.md) — shared package surface and policies  
5. [roadmap.md](./roadmap.md) — current gaps and planned work  

Then branch by concern:

| Concern | Doc |
|--------|-----|
| Intents, events, engine concepts | [engine/overview.md](./engine/overview.md), [engine/intents-and-events.md](./engine/intents-and-events.md) |
| Client UI | [client/overview.md](./client/overview.md), [client/grid.md](./client/grid.md) |
| Encounter feature UI state theming (semantic header states) | [client/encounter-ui-theme.md](./client/encounter-ui-theme.md) |
| Encounter Simulator → mechanics today | [client/local-dispatch.md](./client/local-dispatch.md) |
| Action-resolved encounter toasts (viewer pipeline, dedupe, queue) | [client/local-dispatch.md](./client/local-dispatch.md#encounter-toasts-viewer-aware) |
| Persisted session intent mirror (GameSession `/play`, HTTP, revision queue) | [client/persisted-intent-sync.md](./client/persisted-intent-sync.md) |
| Viewer identity, controlled combatants, client capabilities (simulator vs session) | [client/encounter-viewer-permissions.md](./client/encounter-viewer-permissions.md) |
| Deferred client hooks | [client/feedback-followups.md](./client/feedback-followups.md) |
| Server authority (target + current notes) | [server/authoritative-flow.md](./server/authoritative-flow.md) |
| Location floors → combat seed | [authored-content/location-floor-adapter.md](./authored-content/location-floor-adapter.md) |
| GameSession vs combat | [game-session.md](./game-session.md) |

## Core philosophy (short)

- **`packages/mechanics` (combat)** owns **canonical rules and state** and the **startup** and **runtime intent** application seams. It stays free of React, routes, and Encounter Simulator workflow.
- **`src/features/encounter`** is the **Encounter Simulator**: dev/testing combat workflow (setup, composition, operator shells). It **consumes** combat; it does not own combat truth. **`src/features/game-session`** is **GameSession** (live-play session: lobby, setup, **`/play`**, lifecycle); see [game-session.md](./game-session.md). It does not own combat truth; it **orchestrates** persisted combat load and the shared **`CombatPlayView`** shell for session **`/play`**. **Viewer seat** and **who may act on whose turn** are implemented client-side for UX and **enforced on the server** when combat is **game-session–linked** (see [client/encounter-viewer-permissions.md](./client/encounter-viewer-permissions.md)). Remaining gaps (realtime combat broadcast, **campaign-wide** tenancy on orphan sessions, stale-intent UX polish) are in [roadmap.md](./roadmap.md).
- **`src/features/combat`** (client) owns **reusable combat UI** primitives; it does not own authoritative state.
- **Server** owns **persistence, authority, sequencing, and eventually realtime** around the same mechanics seams. It does **not** fork rules.

## Directory guide

### Top-level

- `architecture.md` — system view and principles  
- `ownership-boundaries.md` — layer responsibilities  
- `game-session.md` — GameSession (lobby, setup, **`/play`**, persisted combat orchestration) vs Encounter Simulator  
- `glossary.md` — terminology  
- `roadmap.md` — milestones, outstanding items, gaps  
- `migration-roadmap.md` — redirect to `roadmap.md`  
- `adr-shared-combat-extraction.md` — ADR: public API, imports, package shape  

### `engine/`

Shared combat engine: state, resolution, space, intents/events, selectors.

### `client/`

Reusable combat UI and Encounter Simulator integration; local dispatch documentation; persisted session intent sync (HTTP mirror, slim context, client queue). Encounter-specific **semantic UI state** colors for active play chrome are documented in [client/encounter-ui-theme.md](./client/encounter-ui-theme.md) (`src/features/encounter/ui/theme/`).

### `server/`

Authoritative server flow; persistence and realtime are described here and in [roadmap.md](./roadmap.md) (there is no separate `server/overview.md`).

### `authored-content/`

Editor-facing maps/floors and the adapter seam into combat runtime seeds.

## When you change behavior or structure

1. Decide which **layer** owns the change ([ownership-boundaries.md](./ownership-boundaries.md)).  
2. If the change is user-visible or cross-cutting, update **architecture** or **roadmap** if the direction shifts.  
3. If the **public mechanics API** changes, update the **ADR** and `packages/mechanics/README.md`.
