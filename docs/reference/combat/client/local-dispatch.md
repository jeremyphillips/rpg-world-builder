# Local dispatch (Encounter → engine)

## Purpose

Describe how the Encounter feature submits truth-changing combat operations today (Phase 4A) and how that stays compatible with future server authority.

## Flow

1. Encounter UI (routes, grid, footer, drawers) gathers user input.
2. Ephemeral UI state (hover, unconfirmed target, AoE preview, modal open) stays in React state — it is **not** an authoritative combat intent.
3. When the user commits a truth-changing action, code should go through **`applyCombatIntent`** (`src/features/mechanics/domain/combat/application/apply-combat-intent.ts`) with a serializable **`CombatIntent`** and an **`ApplyCombatIntentContext`** (RNG, spell lookup for turn boundaries, etc.).
4. The applier returns a **`CombatIntentResult`**: success with `nextState` and **`CombatEvent`** records, or structured failure (`CombatDispatchError`).
5. Encounter applies `nextState` (e.g. `setEncounterState`) and may derive toasts or log side effects from events. **Phase 4D:** log/toast registration uses `flattenLogEntriesFromIntentSuccess` so all `log-appended` chunks in one success are merged; **one** microtask per successful intent (see [`intent-success-log-entries.ts`](../../../../src/features/mechanics/domain/combat/application/intent-success-log-entries.ts)).

**Phase 4B:** End turn, grid movement (`move-combatant`), and action resolution (`resolve-action` → `resolveCombatAction`) all go through `applyCombatIntent`; see `apply-move-combatant-intent.ts` and `apply-resolve-action-intent.ts`.

**Phase 4C:** Documents prep vs commit ([`PHASE_4C_ACTION_PREP_VS_COMMIT.md`](../../../../src/features/mechanics/domain/combat/application/PHASE_4C_ACTION_PREP_VS_COMMIT.md)), hardens `apply-resolve-action-intent` slightly, adds optional `action-log-slice` events, and extracts [`build-resolve-action-intent.ts`](../../../../src/features/encounter/domain/interaction/build-resolve-action-intent.ts) for testable mapping from confirmed hook state. This is **not** a second action migration—the committed path was already unified in 4B.

**Phase 4E:** Consolidation pass — production Encounter uses **`applyCombatIntent` only** for end turn, move, and resolve (see [`MUTATION_ENTRY_POINTS.md`](../../../../src/features/mechanics/domain/combat/application/MUTATION_ENTRY_POINTS.md)). **Start encounter** still creates state with `createEncounterState` in the hook; routing that through the seam is **deferred (Phase 4F+)** unless explicitly scoped. Optional client feedback follow-ups (`action-log-slice`, `registerIntentFailure`) are described in [feedback-followups.md](./feedback-followups.md) — not required for the seam to be valid.

## Ownership

| Concern | Owner |
|--------|--------|
| Intent / result / event types | `src/features/mechanics/domain/combat` (shared engine package) |
| `applyCombatIntent` | Same — pure, no React, no Encounter imports |
| React state, routing, setup | `src/features/encounter` |
| Reusable combat UI primitives | `src/features/combat` (must not import Encounter) |

## Server authority later

The same **`applyCombatIntent`** *shape* (intent in, result out) can be reimplemented as a remote call: the UI still builds intents and consumes results; only the transport changes.

## See also

- [engine/intents-and-events.md](../engine/intents-and-events.md)
- [application/MUTATION_ENTRY_POINTS.md](../../../../src/features/mechanics/domain/combat/application/MUTATION_ENTRY_POINTS.md) (repo path)
- [feedback-followups.md](./feedback-followups.md) — deferred `action-log-slice` / `registerIntentFailure` / start-by-intent notes
