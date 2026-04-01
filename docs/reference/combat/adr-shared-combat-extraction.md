# ADR: Shared combat extraction boundary and server import policy

## Status

**Proposed** — architecture / interface-freeze for Stage 2 extraction. Does not change runtime behavior.

## Context

Combat engine code currently lives under [`src/features/mechanics/domain/combat`](../../../src/features/mechanics/domain/combat). Phase 4 (through 4F) established:

- A **runtime** truth-changing seam: [`applyCombatIntent`](../../../src/features/mechanics/domain/combat/application/apply-combat-intent.ts) with serializable intents and structured results/events.
- A **startup** seam separate from runtime intents: [`startEncounterFromSetup`](../../../src/features/mechanics/domain/combat/application/start-encounter-from-setup.ts) and [`CombatStartupInput`](../../../src/features/mechanics/domain/combat/application/combat-startup.types.ts).

The long-term direction (see [architecture.md](./architecture.md), [ownership-boundaries.md](./ownership-boundaries.md), [server/authoritative-flow.md](./server/authoritative-flow.md)) is:

- **Shared combat core** holds canonical rules, state, and application orchestration that is transport-agnostic.
- **Client** and **server** both consume that core; the server adds authority, persistence, and realtime — it does **not** reimplement rules in a fork.
- **Encounter** and **client combat UI** remain workflow/presentation consumers.

Empirically, **combat is not an isolated leaf module**. It imports multiple sibling areas under `src/features/mechanics/domain` and content types from `src/features/content`. Any extraction plan must name those dependencies or it will fail at compile time.

This ADR freezes a **public API surface** for near-term stability, recommends an initial **package shape**, and defines **import policy** for server work during transition.

## Decision

1. **Combat code must not move wholesale into `server/`.** Server owns session authority, permissions, persistence, and broadcast; shared rules and `applyCombatIntent` / `startEncounterFromSetup` stay in a shared layer consumable by both tiers.

2. **The next structural target is a shared combat core** (as a package or clearly bounded tree), with the server application built **around** it, not as a copy of it.

3. **Client and server both consume the shared core** once extracted; until then, they share the same TypeScript modules via repo layout (see import policy below).

4. **Startup and runtime mutation remain distinct seams** in the shared and server models:
   - **Startup:** `CombatStartupInput` → `startEncounterFromSetup` → initial `EncounterState` (session creation / initialization).
   - **Runtime:** `applyCombatIntent` on existing state (commands with revision/sequencing on the server later).

5. **Extraction must account for sibling mechanics dependencies** — see Sibling dependency inventory.

## Public combat API freeze (near-term stable boundary)

The barrel [`src/features/mechanics/domain/combat/index.ts`](../../../src/features/mechanics/domain/combat/index.ts) re-exports **many** symbols. For **extraction and server integration**, treat the following as the **intentionally stable, version-sensitive surface**.

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

`EncounterState` and exports from [`state/types/`](../../../src/features/mechanics/domain/combat/state/types/index.ts) — **Public** (treat persisted snapshots as **schema-versioned**).

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
- **Transitional:** Server may import from `src/features/mechanics/domain/**` via the same `@/features/mechanics/domain/*` alias as the client (`tsconfig.server.json` includes `src`). No imports from Encounter routes or React UI.
- **Avoid:** Duplicating rules under `server/`; importing `src/features/encounter` or `src/features/combat` from server code.

## Startup vs runtime application boundary

- **Startup:** `CombatStartupInput` → `startEncounterFromSetup` → initial state — not a `CombatIntent` on `null` state.
- **Runtime:** `applyCombatIntent` on existing `EncounterState`.

These stay separate in shared and server APIs.

## Non-goals

This ADR does **not** implement extraction, server routes, persistence, final realtime transport, or full content DTO redesign.

## Consequences

- Positive: stable API list for server work; honest dependency inventory; monolithic-first package default.
- Negative: first package will be large; manage semver via frozen API vs internal re-exports.

## Next step (after ADR approval)

**Physical move + path wiring:** Move `src/features/mechanics/domain` into `packages/mechanics/src` (or agreed layout), update `@/features/mechanics/domain/*` to resolve there, fix **relative imports** that assume a different directory depth (audit `state/stealth`, `state/types`, tests), extend Vitest `include` for package tests, and run `tsc -b` / `vitest run` until green.

**Scaffolding done in-repo:** Root `package.json` declares `"workspaces": ["packages/*"]`; [`packages/mechanics/README.md`](../../../packages/mechanics/README.md) documents the placeholder and move checklist.
