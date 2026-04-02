# ADR: Shared combat extraction boundary and server import policy

## Status

**Accepted** for the combat public surface and import policy. The mechanics package lives under [`packages/mechanics`](../../../packages/mechanics); the combat entry is [`@rpg-world-builder/mechanics`](../../../packages/mechanics/README.md). Server routes consume that package for startup and apply-intent (see [roadmap.md](./roadmap.md) for current server scope).

This ADR remains the **contract** for what counts as stable API vs internal engine; it does not list every implementation detail.

## Context

Combat engine code lives under [`packages/mechanics/src/combat`](../../../packages/mechanics/src/combat). Phase 4 (through 4F) established:

- A **runtime** truth-changing seam: [`applyCombatIntent`](../../../packages/mechanics/src/combat/application/apply-combat-intent.ts) with serializable intents and structured results/events.
- A **startup** seam separate from runtime intents: [`startEncounterFromSetup`](../../../packages/mechanics/src/combat/application/start-encounter-from-setup.ts) and [`CombatStartupInput`](../../../packages/mechanics/src/combat/application/combat-startup.types.ts).

The long-term direction (see [architecture.md](./architecture.md), [ownership-boundaries.md](./ownership-boundaries.md), [server/authoritative-flow.md](./server/authoritative-flow.md)) is:

- **Shared combat core** holds canonical rules, state, and application orchestration that is transport-agnostic.
- **Client** and **server** both consume that core; the server adds authority, persistence, and realtime — it does **not** reimplement rules in a fork.
- **Encounter** and **client combat UI** remain workflow/presentation consumers.

Empirically, **combat is not an isolated leaf module**. It imports multiple sibling areas under `packages/mechanics/src` and content types from `src/features/content`. Any extraction plan must name those dependencies or it will fail at compile time.

This ADR freezes a **public API surface** for near-term stability, recommends an initial **package shape**, and defines **import policy** for server work during transition.

## Decision

1. **Combat code must not move wholesale into `server/`.** Server owns session authority, permissions, persistence, and broadcast; shared rules and `applyCombatIntent` / `startEncounterFromSetup` stay in a shared layer consumable by both tiers.

2. **The next structural target is a shared combat core** (as a package or clearly bounded tree), with the server application built **around** it, not as a copy of it.

3. **Client and server both consume the shared core** once extracted; until then, they share the same TypeScript modules via repo layout (see import policy below).

4. **Startup and runtime mutation remain distinct seams** in the shared and server models:
   - **Startup:** `CombatStartupInput` → `startEncounterFromSetup` → initial `EncounterState` (session creation / initialization).
   - **Runtime:** `applyCombatIntent` on existing state (commands with revision/sequencing on the server). On the server, persisted sessions use **`baseRevision`** for optimistic concurrency (see [roadmap.md](./roadmap.md)).

5. **Extraction must account for sibling mechanics dependencies** — see Sibling dependency inventory.

## Public combat API freeze (near-term stable boundary)

The barrel [`packages/mechanics/src/combat/index.ts`](../../../packages/mechanics/src/combat/index.ts) re-exports **many** symbols. For **extraction and server integration**, treat the following as the **intentionally stable, version-sensitive surface** (also re-exported from [`packages/mechanics/src/index.ts`](../../../packages/mechanics/src/index.ts) for the combat-focused package entry).

### Application layer

| Symbol | Purpose | Public / shared |
|--------|---------|-----------------|
| `applyCombatIntent` | Applies a runtime `CombatIntent`; returns `CombatIntentResult`. | **Public** |
| `ApplyCombatIntentContext` | Options for turn advance, resolve, movement, spatial follow-up. | **Public** |
| `startEncounterFromSetup` | `CombatStartupInput` → `CombatStartupResult`. | **Public** |
| `flattenLogEntriesFromIntentSuccess`, `flattenLogEntriesFromEvents` | Merge `log-appended` events into log rows. | **Public** |

### Startup types

`CombatStartupInput`, `CombatStartupResult`, `CombatStartupSuccess`, `CombatStartupFailure`, `CombatStartupError` — **Public**.

### Intents

`CombatIntent`, `CombatIntentKind`, per-kind intent types, guard functions — **Public** wire shapes.

### Results / events / errors

`CombatIntentResult`, `CombatIntentSuccess`, `CombatIntentFailure`, `CombatDispatchError`, `CombatValidationIssue`, `CombatEvent` — **Public**.

### Canonical state types

`EncounterState` and exports from [`state/types/`](../../../packages/mechanics/src/combat/state/types/index.ts) — **Public** (treat persisted snapshots as **schema-versioned**).

### Engine internals

`createEncounterState`, `advanceEncounterTurn`, resolution helpers, and the large `state/` export surface — **internal to the shared package** until a deliberate `exports` map narrows consumers.

## Sibling dependency inventory

| Dependency area | Classification |
|-----------------|----------------|
| **Environment** | Must move with shared combat (or shared mechanics bundle). |
| **Perception** | Same. |
| **Conditions** | Same. |
| **Effects** | Same. |
| **Character / abilities** | Same. |
| **Dice / resolution engines** | Same. |
| **Spells (mechanics)** e.g. `caster-options` | Must move with combat or split later — **follow-up**. |
| **Initiative resolver** (`resolution/resolvers`) | Must move with bundle. |
| **Content: Spell / Monster types** | Separate DTOs or minimal types — **follow-up** to narrow. |

## Package-shape recommendation

**Default: one broader shared mechanics package first** (e.g. `packages/mechanics` containing the current `domain` tree), not many micro-packages, until boundaries stabilize.

## Transitional import policy

- **Target:** Server and client import shared rules from the published package path with a clear `exports` map.
- **Transitional:** Server may import from `packages/mechanics/src/**` via the same `@/features/mechanics/domain/*` alias as the client (and optional `@rpg-world-builder/mechanics` for the combat entry). No imports from Encounter routes or React UI.
- **Avoid:** Duplicating rules under `server/`; importing `src/features/encounter` or `src/features/combat` from server code.

## Startup vs runtime application boundary

- **Startup:** `CombatStartupInput` → `startEncounterFromSetup` → initial state — not a `CombatIntent` on `null` state.
- **Runtime:** `applyCombatIntent` on existing `EncounterState`.

These stay separate in shared and server APIs.

## Non-goals

This ADR does **not** specify realtime transport, full permission models, event-sourcing, or complete content DTO redesign. Those evolve in product code and [roadmap.md](./roadmap.md).

## Consequences

- Positive: stable API list for server work; honest dependency inventory; monolithic-first package default.
- Negative: first package will be large; manage semver via frozen API vs internal re-exports.

## Implementation notes (current)

- **Package extraction (Stage 2):** Mechanics source lives in `packages/mechanics/src`; `@/features/mechanics/domain/*` resolves there; Vitest includes package tests. See [`packages/mechanics/README.md`](../../../packages/mechanics/README.md).
- **Server persistence:** MongoDB-backed combat sessions with revisioned apply-intent are described in [roadmap.md](./roadmap.md) and [server/authoritative-flow.md](./server/authoritative-flow.md).
