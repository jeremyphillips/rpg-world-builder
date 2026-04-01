# Local dispatch (Encounter → engine)

## Purpose

Describe how the Encounter feature submits truth-changing combat operations today (Phase 4A) and how that stays compatible with future server authority.

## Flow

1. Encounter UI (routes, grid, footer, drawers) gathers user input.
2. Ephemeral UI state (hover, unconfirmed target, AoE preview, modal open) stays in React state — it is **not** an authoritative combat intent.
3. When the user commits a truth-changing action, code should go through **`applyCombatIntent`** (`src/features/mechanics/domain/combat/application/apply-combat-intent.ts`) with a serializable **`CombatIntent`** and an **`ApplyCombatIntentContext`** (RNG, spell lookup for turn boundaries, etc.).
4. The applier returns a **`CombatIntentResult`**: success with `nextState` and **`CombatEvent`** records, or structured failure (`CombatDispatchError`).
5. Encounter applies `nextState` (e.g. `setEncounterState`) and may derive toasts or log side effects from events.

**Phase 4B:** End turn, grid movement (`move-combatant`), and action resolution (`resolve-action` → `resolveCombatAction`) all go through `applyCombatIntent`; see `apply-move-combatant-intent.ts` and `apply-resolve-action-intent.ts`.

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
