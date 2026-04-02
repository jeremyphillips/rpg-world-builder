# Combat Ownership Boundaries

## Purpose

This document defines which layer owns which responsibilities.

This is the primary reference for deciding **where code belongs** in the combat system—during refactors and for new features. It complements [architecture.md](./architecture.md) (system view) and [roadmap.md](./roadmap.md) (what is shipped and what remains).

## Core rule

> Combat owns truth. The Encounter Simulator owns this combat workflow shell. **GameSession** owns live-play **session** workflow (lobby, setup, lifecycle) in `src/features/game-session`—see [game-session.md](./game-session.md).

That rule is expanded below.

## Shared combat engine owns

The shared combat engine owns canonical combat truth and shared derivation.

It owns:

- combat state types
- combat state mutations
- action legality
- targeting legality
- movement legality
- turn progression
- conditions/effects/concentration
- reactions
- combat space / runtime board state
- selectors
- pure presentation derivation
- intents/results/events

Questions the engine should answer:

- Is this target valid?
- Can this actor move here?
- Does line of sight exist?
- Is the target visible?
- What happens when HP reaches zero?
- Does concentration end here?
- What events happened as a result of this action?

The engine must not own:

- React components
- route state
- setup flow
- Encounter Simulator-specific workflow
- modal/drawer orchestration
- server transport
- authored location editor semantics

## Client combat UI owns

Reusable client combat UI owns rendering primitives and client-only presentation helpers.

It owns:

- reusable combat components
- reusable combat renderer layers
- the shared **active play** layout shell (**`CombatPlayView`**) — header/grid/sidebar/drawer **slots** — consumed by Encounter Simulator and GameSession **`/play`**, not simulator-only workflow
- client-only formatting/chips/tooltips
- optional reusable combat UI hooks
- wrappers around canonical state/results for display

Questions client combat UI should answer:

- How should a combatant preview card render?
- How should a grid cell be visually styled?
- How should a combat log entry display?
- How should a reusable action-row primitive render?

Client combat UI must not own:

- combat truth
- Encounter Simulator workflow
- route/campaign lookup
- setup modal types
- server authority
- authored location semantics

## Encounter Simulator feature owns

The Encounter Simulator owns **dev/testing** combat workflow and orchestration (single operator, all combatants). It does **not** own **GameSession** (live-play session product shell—see [game-session.md](./game-session.md)).

It owns:

- simulator routes and navigation
- setup flow
- active-screen composition
- feature-specific wrappers
- operator workflow in this surface
- drawer shells
- modal shells
- route/campaign-specific link construction
- temporary UI state tied to feature workflow

Questions the Encounter Simulator should answer:

- Which setup modal is open?
- Which floor is selected for this encounter?
- How should the active screen be composed?
- How do feature-level wrappers adapt encounter state into combat props?

The Encounter Simulator must not own:

- shared combat truth
- reusable engine derivation
- reusable combat UI primitives that can live elsewhere

## GameSession feature owns

The **GameSession** feature (`src/features/game-session`) owns the **live-play session** shell: game session records, campaign-scoped routes, **lobby**, **setup**, **`/play`**, session lifecycle status, and **ephemeral lobby presence** (Socket.IO) for “who is here.”

It owns:

- game session CRUD and lifecycle actions (e.g. draft / scheduled / open lobby / start session)
- lobby and setup presentation that is **not** combat encounter state
- **`/play` orchestration**: resolve **`activeEncounterId`**, fetch persisted combat (**`GET /api/combat/sessions/:id`**), hydrate local state, mirror intents (**`POST .../intents`**) after local applies, render the shared **`CombatPlayView`** shell (via **`GameSessionEncounterPlaySurface`** + **`useEncounterActivePlaySurface`**)
- mapping expected party display to campaign roster (with a placeholder seam for stricter rules later)

It must **not** own:

- canonical **encounter** / combat state (that remains mechanics + server combat application)
- combat rules, intents, or grid truth (it **calls** shared mechanics and HTTP APIs)
- Encounter Simulator workflow (roster/setup/modals for the dev surface stay in **`encounter`**)

“Start encounter / bind combat to this session” orchestration belongs here **only** as workflow that **invokes** the same combat seams used elsewhere—not as a second combat engine.

## Server combat application owns

Server combat application owns authority and session orchestration.

It owns:

- intent validation
- permission checks
- latest-state loading
- resolving through the shared engine
- persistence
- broadcast/realtime sync
- session lifecycle
- reconnect/resync behavior

Questions server combat application should answer:

- Is this client allowed to perform this action?
- Is this intent stale or still valid?
- What is the latest authoritative state?
- What should be persisted and broadcast?

The server must not duplicate engine rules logic unnecessarily.

## Authored content owns

Authored content owns map/floor/location authoring concepts.

It owns:

- location floor schema
- editor semantics
- authored rooms/doors/objects/tags
- floor metadata
- authored lighting/terrain semantics
- adapter inputs into combat seed creation

Questions authored content should answer:

- How is a floor represented in the editor?
- What authored tags/objects/doors exist?
- What location metadata belongs to the floor?

Authored content must not directly own:

- live combat truth
- runtime-only combat state
- server session authority

## Adapter seam owns

The adapter seam bridges authored content and combat runtime.

It owns:

- normalization of authored floor data into combat seed data
- translation of authored objects/terrain/light into combat-usable runtime state

It should be explicit and narrow.

## Quick decision guide

### Put code in shared combat engine if:
- it decides truth
- it mutates canonical combat state
- the server will need it
- it is pure and serializable

### Put code in client combat UI if:
- it is a reusable combat-facing component or client presentation helper (including the shared **`CombatPlayView`** shell)
- it should not depend on Encounter Simulator routes/workflow or GameSession session orchestration

### Put code in Encounter Simulator (`src/features/encounter`) if:
- it is setup, layout, orchestration, or feature workflow for the dev/testing combat surface
- it is a shell around reusable combat pieces

### Put code in GameSession (`src/features/game-session`) if:
- it is live-play **session** lifecycle, lobby, or setup for a table session
- it is ephemeral lobby presence or session-scoped UI that is not encounter combat state

### Put code in server combat application if:
- it is about authority, validation, persistence, sync, or session flow

### Put code in authored content if:
- it belongs to location/map/floor authoring or authoring semantics