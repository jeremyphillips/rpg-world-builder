# Combat Intents and Events

## Purpose

This document defines the role of intents, results, and events in the combat architecture.

It should answer:

- what an intent is
- what an event is
- what belongs in an intent payload
- what should remain local UI state
- how intents/events support the move toward server-authoritative combat

## Why intents exist

The combat refactor is moving from:

- UI-driven local mutation helpers

toward:

- intent dispatch
- canonical resolution
- structured results/events

This shift is needed so that:

- Encounter UI becomes a consumer of combat truth
- truth-changing requests have a stable contract
- local dispatch can later be replaced or backed by server authority
- logs/toasts can derive from canonical outcomes instead of ad hoc mutation-side strings

## What an intent is

An intent is a structured request to perform a truth-changing combat operation.

Examples:
- end turn
- move combatant
- resolve action
- place area
- choose spawn cell

An intent should describe **what is being requested**, not how the UI happened to gather that input.

## Intent design principles

Intents should be:

- explicit
- serializable
- minimal but sufficient
- based on canonical combat concepts
- free of router/component concerns

Intent payloads should prefer combat concepts like:
- actor combatant id
- target combatant id(s)
- destination cell id
- selected action runtime id
- placement coordinates or cell ids
- chosen spawn cell id

Intents should avoid:
- React objects
- component instances
- route params as implicit context
- giant “do everything” payloads
- UI-only temporary state

## What is not an intent

Not every client interaction should become an authoritative combat intent.

These should usually remain local UI state:
- hover state
- modal open/close state
- drawer mode
- unconfirmed target selection
- unconfirmed area preview
- temporary placement preview
- local sorting/filtering of visible UI rows

The rule is:

> If it does not change canonical combat truth, it probably should not be a combat intent.

## Initial likely intent categories

These are the likely first real intent categories.

### `EndTurnIntent`
Request to end the active combatant’s turn.

### `MoveCombatantIntent`
Request to move a combatant to a destination cell.

### `ResolveActionIntent`
Request to resolve an action using a selected actor/action/target or target set.

### `PlaceAreaIntent`
Request to confirm an area placement choice for an action.

### `ChooseSpawnCellIntent`
Request to confirm where a spawned entity should be placed.

These are examples, not necessarily the final full taxonomy.

## What an event is

An event is a canonical record of something that happened as a result of combat resolution.

Examples:
- combatant moved
- action resolved
- damage applied
- condition applied
- concentration ended
- combatant defeated
- turn ended
- spawn created

Events are useful for:
- combat log rows
- toasts
- timelines
- replay/debug tools
- server broadcast
- auditability of combat resolution

## What a result is

A result is the structured outcome of handling an intent.

A result may include:
- success/failure
- validation issues
- emitted events
- updated state or a reference to updated state
- metadata about what changed

A result should be more structured than:
- “it worked”
- a direct mutation with no canonical output
- ad hoc strings assembled in UI code

## Relationship between intents, results, and events

The rough flow is:

1. UI gathers input
2. UI submits an intent
3. local dispatcher or future server receives the intent
4. engine validates and resolves it
5. a result is returned
6. result includes one or more canonical events
7. UI renders updated state and may format events into log/toast display

## Relationship to Phase 4 local dispatch

Before server authority exists, the client will still need a local dispatch seam.

That seam should already use:
- intent input
- result output
- canonical event records

so that later the same UI can keep its mental model while the implementation changes from:
- local reducer/service

to:
- server-backed dispatch

## Relationship to server authority

Long-term, the server should receive intents and produce canonical results/events.

That means intent/event design should not be tightly coupled to:
- component structure
- route structure
- Encounter-only shells

This is why their contracts belong near combat engine ownership.

## Implementation status (Phase 4A)

Concrete types and the local apply seam live under the shared combat engine package:

- **Intents:** `src/features/mechanics/domain/combat/intents/` — discriminated union (`end-turn`, `move-combatant`, `resolve-action`, `place-area`, `choose-spawn-cell`).
- **Results / events / errors:** `src/features/mechanics/domain/combat/results/`.
- **Application:** `src/features/mechanics/domain/combat/application/apply-combat-intent.ts` — `applyCombatIntent(state, intent, context)`; today calls shared engine functions; later can be backed by server authority without changing intent/result shapes.
- **Mutation audit:** `src/features/mechanics/domain/combat/application/MUTATION_ENTRY_POINTS.md`.

End turn, grid movement, and action resolution (`resolveCombatAction`) are wired through `applyCombatIntent` from Encounter state (`useEncounterState`). `place-area` / `choose-spawn-cell` remain reserved for future explicit intents if needed (often covered by `resolve-action` today).

### Phase 4C (harden + document the action seam)

Phase 4C is **not** a second migration: committed action execution was already unified in Phase 4B on `handleResolveAction` → `ResolveActionIntent` → `applyCombatIntent` → `applyResolveActionIntent` → `resolveCombatAction`.

This pass adds:

- [`PHASE_4C_ACTION_PREP_VS_COMMIT.md`](../../../../src/features/mechanics/domain/combat/application/PHASE_4C_ACTION_PREP_VS_COMMIT.md) — classifies UI-local prep (A), confirmed payload shaping (B), and authoritative execution (C).
- Narrow hardening in `apply-resolve-action-intent.ts` (e.g. unknown `actionId` when the actor has a non-empty action list) and optional `action-log-slice` events (log entry types appended) for future log/toast work.
- Optional pure helper [`build-resolve-action-intent.ts`](../../../../src/features/encounter/domain/interaction/build-resolve-action-intent.ts) mapping confirmed hook fields into `ResolveActionIntent`.

### Phase 4D (flatten log feedback per successful intent)

- [`intent-success-log-entries.ts`](../../../../src/features/mechanics/domain/combat/application/intent-success-log-entries.ts) — `flattenLogEntriesFromIntentSuccess` / `flattenLogEntriesFromEvents` merge all `log-appended` slices from one `CombatIntentSuccess` into a single `CombatLogEvent[]` in event order.
- Encounter (`useEncounterState`) calls `registerCombatLogAppended` at most **once** per successful intent via one `queueMicrotask`, so multiple `log-appended` events in one result do not duplicate toasts or scheduling.

### Phase 4E (seam canonical; honest unmigrated surface)

- **Migrated flows** (end turn, move combatant, resolve action): production code paths go through **`applyCombatIntent` only** — [`useEncounterState`](../../../../src/features/encounter/hooks/useEncounterState.ts) is the sole production caller; routes do not bypass the application seam for these operations.
- **Deferred feedback enhancements** (optional richer UX, not required for validity): see [client/feedback-followups.md](../client/feedback-followups.md) for **`action-log-slice`** and **`registerIntentFailure`**.

### Phase 4F (startup seam — not a runtime intent)

- **Encounter start** uses **`startEncounterFromSetup`** ([`start-encounter-from-setup.ts`](../../../../src/features/mechanics/domain/combat/application/start-encounter-from-setup.ts)) with **`CombatStartupInput`** ([`combat-startup.types.ts`](../../../../src/features/mechanics/domain/combat/application/combat-startup.types.ts)), which calls engine **`createEncounterState`**. This keeps **initialization** separate from **`applyCombatIntent`** (commands on an existing encounter). Do not add `StartEncounterIntent` to the runtime intent union for this — startup is not a transition on prior `EncounterState`.
- **Still unmigrated:** DM/manual mutators, reset.

## Open design questions

As the system evolves, these questions will need clear answers:

- how granular should events be?
- should results carry full updated state or just event + patch references?
- where should validation issues live?
- how much optimistic local UI behavior is acceptable before server authority?

These are valid future refinements, but the immediate direction should remain:
- explicit intents
- explicit results
- canonical events