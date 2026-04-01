# Combat / Encounter Refactor Reference

## Purpose

This document defines the target architecture for the ongoing refactor of the current `encounter` feature into a cleaner separation of:

- **authoritative combat engine**
- **client combat UI primitives**
- **encounter feature workflows and screen composition**
- **location authoring and adapters into combat runtime**

This refactor is motivated by two long-term needs:

1. **Location floors must be usable inside the encounter UI** without leaking authored map concepts into runtime combat internals.
2. **Multiplayer live play will require server-authoritative rules resolution**, so any code that determines truth must be shareable with the server and must not remain UI-owned.

This file should be treated as the reference frame for agent work during the refactor.

---

## Why this refactor exists

The current `src/features/encounter` tree mixes several different responsibilities:

- feature routes and screen composition
- setup workflow
- reusable combat UI
- combat presentation derivation
- combat runtime helpers/adapters
- runtime board/grid logic (`space`)
- state-related logic that will eventually need to run on the server

That worked for an initial single-surface implementation, but it is now too overloaded.

The most important architectural correction is:

> **Encounter is the product feature. Combat is the reusable engine.**

From now on, code should be organized around ownership and authority, not around where it was first implemented.

---

## Core architecture

### 1. Shared combat engine

This layer owns **truth**.

It must be able to run identically on the client and the server.

It owns:

- combat state types
- combat state mutations
- action legality and targeting
- action resolution
- turn progression
- conditions, effects, concentration, auras
- reactions and opportunity attacks
- stealth, visibility, LOS, perception
- combat space / runtime board state
- selectors and deterministic derived models
- canonical intents and events

This layer must be:

- pure
- deterministic
- serializable
- React-free
- browser-free
- route-free
- UI-framework-free

### 2. Server combat application layer

This layer owns **authority and live session orchestration**.

It owns:

- receiving client intents
- validating permissions
- loading latest state
- applying the shared combat engine
- persisting snapshots/events
- broadcasting canonical updates
- handling sequencing/conflicts/reconnect

This layer does **not** own core rules logic. It uses the shared combat engine.

### 3. Client combat UI layer

This layer owns **reusable combat-facing UI primitives**.

It owns:

- reusable combat cards
- reusable combat avatar/chips/badges
- reusable combat grid renderer
- reusable combat presentation hooks
- UI formatting of canonical combat state/events

This layer does **not** own truth.

### 4. Encounter feature layer

This layer owns the **product workflow** around running combat in the app.

It owns:

- routes
- setup flow
- active encounter screen composition
- feature-specific drawers/modals/layout
- DM workflow and orchestration
- location floor selection/setup
- integration between authored content and combat runtime startup

Encounter is a consumer of combat, not the owner of combat truth.

### 5. Locations feature layer

This layer owns **authored world/map/floor content**.

It owns:

- location floor schema
- map/floor editor state
- authored rooms, cells, doors, obstacles, tags
- authoring metadata
- adapters from authored floor data into combat runtime seeds

Locations should not leak editor-facing concepts directly into combat runtime state.

---

## Naming guidance

### Use **combat** for engine/runtime/shared logic

Use `combat` when the code is about:

- runtime truth
- legality
- state transitions
- selectors
- reusable combat presentation derivation
- client/server shared models

### Use **encounter** for feature/UI/workflow composition

Use `encounter` when the code is about:

- routes
- active view composition
- setup workflow
- feature-specific modals/drawers
- orchestration around combat

### Use **location floor** for authored map data

Use `location floor` or similar location-owned terms for:

- authored floor/map content
- editor-facing semantics
- content management concepts

### Use **combat space** for runtime board representation

Use `combat space` for the normalized board/runtime representation used by combat logic.

---

## Ownership rules

### Shared combat engine owns

Questions like:

- Is this target legal?
- Can this actor move here?
- Is there line of sight?
- Does darkvision apply?
- Is the target visible?
- Does concentration end here?
- Does a spawn replace corpse/remains?
- What happens when HP reaches zero?
- What events/log records result from this action?

### Client combat UI owns

Questions like:

- Which panel is open?
- Which row is hovered?
- Which view mode is active?
- How should canonical data be displayed?
- How should badges/cards be rendered?
- How should toasts/log rows be phrased for the user?

### Encounter owns

Questions like:

- Which floor was selected for this encounter?
- Which setup modal is active?
- How does the active encounter page compose its regions?
- Which interactions are DM-only?
- Which product workflow starts combat from authored content?

### Locations owns

Questions like:

- How is a floor authored and edited?
- How are rooms/doors/objects represented in content terms?
- What metadata belongs to the location model?
- How is authored floor data exported into combat runtime seed data?

---

## Authority rule

This is the most important rule in the refactor:

> **Any code that determines truth in live play cannot remain UI-owned.**

If multiplayer requires the server to validate or resolve it, the code belongs in the shared combat engine.

This applies to:

- action requirements
- targeting legality
- line of sight / visibility
- movement legality
- HP / damage / death transitions
- condition applications
- concentration
- reaction availability
- spawn/replacement behavior
- turn progression

---

## Current high-level target structure

This is the intended shape, even if the repo reaches it incrementally.

```txt
shared/
  combat/
    domain/
      state/
      resolution/
      runtime/
      space/
      selectors/
      presentation/
      intents/
      events/
      adapters/

server/
  features/
    combat/
      application/
      realtime/
      persistence/
      services/
      sockets/
      routes/
    encounter/
      application/
      routes/
    content/
      locations/
        application/
        services/

src/
  features/
    combat/
      components/
      hooks/
      presentation/
      providers/
    encounter/
      routes/
      components/
      hooks/
      context/
      adapters/
    content/
      locations/
        domain/
        components/
        routes/
        adapters/
```

Short-term, the shared combat engine may continue to live under a path like:

```txt
src/features/mechanics/domain/combat
```

That is acceptable as an intermediate step so long as the code remains compatible with future server sharing.

---

## Immediate refactor direction

### Rename engine ownership

**Phase 1 (done):** the shared mechanics engine folder is `src/features/mechanics/domain/combat` (renamed from `encounter`). It holds engine/runtime/state/resolution logic, not encounter feature composition.

### Move runtime board/space logic out of encounter feature

**Phase 1 (done):** runtime grid/space lives at `src/features/mechanics/domain/combat/space` (moved from `src/features/encounter/space`). Combat space is engine-owned and will be needed by the server.

### Create a combat presentation/selectors layer

Most of the current `src/features/encounter/domain` is really shared combat derivation.

Target direction:

```txt
src/features/mechanics/domain/combat/presentation
```

and/or:

```txt
src/features/mechanics/domain/combat/selectors
```

### Extract reusable client combat UI

Create a top-level reusable client combat UI area:

```txt
src/features/combat/components
src/features/combat/hooks
src/features/combat/presentation
```

Encounter-specific wrappers stay in `src/features/encounter`.

**Current package layout and import boundaries** (maintained as its own reference, not duplicated here): **[combat-client-ui.md](./combat-client-ui.md)**.

### Create the floor adapter seam

Add a dedicated adapter for converting authored floor data into combat startup/runtime seed data.

Initial target:

```txt
src/features/content/locations/adapters/locationFloorToCombatSeed.ts
```

---

## Folder-specific guidance from the current tree

### `src/features/mechanics/domain/combat`

This is the shared combat engine (Phase 1: renamed from `encounter`).

### `src/features/mechanics/domain/combat/space`

Runtime board logic lives here (Phase 1: moved from `src/features/encounter/space`). It is not encounter workflow composition.

### `src/features/encounter/domain`

This should be treated as combat presentation/selectors/domain derivation, not encounter feature ownership.

Likely destinations:

- `combat/presentation`
- `combat/selectors`

### `src/features/encounter/helpers`

This folder is too broad and should be dissolved over time into explicit destinations such as:

- `adapters`
- `presentation`
- `formatters`
- `assemblers`
- `devtools`

Avoid creating or preserving generic `helpers` as a catch-all.

### `src/features/encounter/components/setup`

This remains encounter-owned.

It is setup workflow and feature composition.

### `src/features/encounter/components/active`

Split into:

- reusable combat UI primitives
- encounter-owned wrappers/orchestration

### `src/features/encounter/routes`

These remain encounter-owned.

---

## Grid split guidance

**Phase 3D:** Generic grid rendering lives in **`CombatGrid`**; **`EncounterGrid`** is a thin wrapper that forwards the same props to **`CombatGrid`** (feature-owned import path for the active encounter screen).

```txt
src/features/combat/components/grid/CombatGrid.tsx
src/features/encounter/components/active/grid/EncounterGrid.tsx
```

Cell visual plumbing (`cellVisualState.ts`, `cellVisualStyles.ts`) lives under **`src/features/combat/components/grid/`**.

### `CombatGrid` should own

- generic grid rendering
- generic cell/token/obstacle rendering contracts
- callback-based interaction hooks
- view-model-driven rendering

### Encounter shell (routes / parents / `EncounterGrid` wrapper) should own

- supplying the grid view model and callbacks (pan/zoom, hover, token popover renderer, interaction flags)
- feature-specific orchestration around the grid (selected actor/target, modals, drawers, DM workflow) — **not** inside `CombatGrid`

---

## Action/drawer split guidance

Action drawers should be split between:

- reusable combat UI primitives/panels
- encounter-owned orchestration shells

**Phase 3E (drawer panel leaves):** prop-driven panels and small format/hint helpers live outside Encounter; shells stay feature-owned.

```txt
src/features/combat/components/panels/AoePlacementPanel.tsx
src/features/combat/components/panels/SingleCellPlacementPanel.tsx
src/features/combat/components/panels/CasterOptionsDrawerPanel.tsx
src/features/combat/presentation/aoePlacementFormat.ts
src/features/mechanics/domain/combat/presentation/actions/derive-action-unavailable-hint.ts

src/features/encounter/components/active/drawers/CombatantActionDrawer.tsx
src/features/encounter/components/active/drawers/AllyActionDrawer.tsx
src/features/encounter/components/active/drawers/OpponentActionDrawer.tsx
```

**Phase 3F (combat log display leaves):** grouped log entry rendering and presentable-effects lists live in combat; panel/modal chrome stays in Encounter.

```txt
src/features/combat/components/combat-log/CombatLogEntry.tsx
src/features/combat/components/combat-log/PresentableEffectsList.tsx

src/features/encounter/components/active/combat-log/CombatLogPanel.tsx
src/features/encounter/components/active/combat-log/CombatLogModal.tsx
```

Keep in mind:

- local panel state and composition can remain encounter-owned
- legality and available actions must be derived from shared combat logic
- the server will eventually validate all action execution

---

## Intents and events

To support server-authoritative multiplayer, the combat layer should move toward **intent-based operations**.

### Canonical intents

Examples:

- `StartCombatIntent`
- `MoveCombatantIntent`
- `ResolveActionIntent`
- `PlaceAreaIntent`
- `ChooseSpawnCellIntent`
- `EndTurnIntent`
- `UseReactionIntent`

These represent truth-changing requests and should be serializable.

### Canonical events

Examples:

- `CombatStartedEvent`
- `CombatantMovedEvent`
- `ActionResolvedEvent`
- `DamageAppliedEvent`
- `ConditionAppliedEvent`
- `ConcentrationEndedEvent`
- `CombatantDefeatedEvent`
- `SpawnCreatedEvent`
- `TurnEndedEvent`

These should be canonical outputs of the engine/application layer.

UI toasts and log messages should be derived from these events, not treated as the canonical source of truth.

---

## Client-local state vs authoritative state

Not every interaction needs to be a server intent.

### Keep client-local

- hover state
- panel open/close state
- temporary selection previews
- local formatting preferences
- ephemeral UI-only modes

### Make authoritative / intent-based

- movement
- action resolution
- end turn
- reaction usage
- spawn placement
- state-changing effect application
- anything that changes truth visible to multiple players

---

## Location floor integration strategy

The goal is **not** to push authored floor data directly into encounter UI state.

The correct seam is:

```txt
LocationFloor -> CombatSeed / CombatSpaceSeed
```

### Locations side owns

- authored schema
- editor semantics
- authoring metadata
- authored objects/doors/terrain/light definitions

### Combat side owns

- normalized runtime board/space
- runtime blockers/cover/visibility data
- runtime obstacle/cell placement
- combat-usable environment state

### Adapter owns

- transforming authored floor data into runtime seed data
- normalizing authored concepts into combat-facing representations
- keeping the boundary explicit

This adapter should avoid leaking editor-facing concepts deep into combat runtime.

---

## Migration phases

### Phase 1 — Establish naming and ownership boundaries

- rename engine `encounter` -> `combat`
- move `space` into combat engine ownership
- create clear exports that reflect the new ownership model

### Phase 2 — Move pure combat derivation out of encounter feature

- create combat presentation/selectors layer
- migrate pure files from `src/features/encounter/domain`
- remove unnecessary `encounter-` prefixes from reusable logic
- keep tests near moved files

### Phase 3 — Extract reusable client combat UI

- extract avatar/card/badge/chip primitives
- split `EncounterGrid` into generic renderer + encounter wrapper
- split action/drawer **panel leaves** (under `src/features/combat/components/panels/`, etc.) from encounter **drawer shells** (`CombatantActionDrawer`, ally/opponent drawers)
- split combat log **display leaves** (`src/features/combat/components/combat-log/`) from encounter **log shells** (`CombatLogPanel`, `CombatLogModal`)

See **[combat-client-ui.md](./combat-client-ui.md)** for what lives under `src/features/combat` and how it relates to the engine and Encounter.

### Phase 4 — Introduce canonical intents and events

- define shared intent types
- define shared event types
- convert state-changing entry points to intent-shaped contracts
- derive logs/toasts from canonical events

Implementation detail and phase status: **[combat/migration-roadmap.md](./combat/migration-roadmap.md)**, **[combat/client/local-dispatch.md](./combat/client/local-dispatch.md)**. Phase 4E documents the local **runtime** seam as canonical for end turn, move, and resolve. Phase 4F adds **`startEncounterFromSetup`** for **encounter initialization** (not a runtime intent). Optional deferred client hooks (`action-log-slice` consumption, `registerIntentFailure`) are described in **[combat/client/feedback-followups.md](./combat/client/feedback-followups.md)**.

### Phase 5 — Add server combat application layer

- create live combat session service
- receive intents server-side
- apply shared combat engine
- persist and broadcast canonical updates

---

## Decision rules for agents

Use these rules when deciding where code belongs.

### Put code in shared combat engine if

- it decides truth
- it determines legality
- it mutates or derives canonical combat state
- the server will need it
- it can be pure and serializable

### Put code in client combat UI if

- it is a reusable combat-facing component or hook
- it renders shared combat models
- it does not depend on encounter feature workflow

### Put code in encounter if

- it is route/layout/setup/orchestration code
- it is a feature-specific modal/drawer/screen shell
- it coordinates product workflow around combat

### Put code in locations if

- it represents authored location/floor/map data
- it belongs to content editing or content semantics
- it prepares authored floor data for export into combat seed data

---

## Guardrails

### Do not let shared combat engine become UI-aware

Avoid:

- React imports
- browser-only APIs
- route context dependencies
- JSX in derived models
- toast strings as canonical outputs
- editor/content UI concepts baked into runtime rules

### Do not let encounter continue to own combat truth

Avoid:

- feature-local legality checks that do not use shared combat logic
- feature-local state transitions for truth-changing actions
- grid/runtime logic trapped inside encounter-only components

### Do not let `helpers` become the fallback destination

When moving or creating code, use explicit folders that communicate intent.

Examples:

- `adapters`
- `presentation`
- `selectors`
- `formatters`
- `devtools`

### Prefer data-first canonical outputs

The engine should prefer:

- events
- result records
- state change descriptors
- normalized presentation models

The UI can format those into:

- toasts
- labels
- chips
- modal text
- combat log rows

---

## Working assumptions during the refactor

These assumptions should remain stable unless explicitly revised.

1. **Combat** is the reusable engine concept.
2. **Encounter** is the feature/UI/workflow concept.
3. **Location floor** is authored source data.
4. **Combat space** is normalized runtime board state.
5. Any logic needed for server-authoritative live play must be moved out of encounter feature ownership.
6. The refactor is expected to be incremental and extensive; intermediate compatibility layers are acceptable if ownership direction remains clear.

---

## Definition of success

The refactor is successful when:

- the combat engine can run identically on client and server
- encounter UI consumes combat state rather than owning truth
- location floors enter combat through an explicit adapter seam
- reusable combat UI is separated from encounter workflow
- authority boundaries are obvious from folder/file placement
- agents can classify new code by ownership without ambiguity

---

## Short summary

Use this mental model during the refactor:

> **Combat owns truth. Encounter owns workflow. Locations own authored floors. Adapters bridge authored floors into combat runtime. The server will eventually authoritatively run combat, so truth cannot stay UI-owned.**

