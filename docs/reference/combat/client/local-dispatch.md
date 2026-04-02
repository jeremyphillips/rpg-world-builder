# Local dispatch (Encounter → engine)

## Purpose

Describe how the Encounter feature submits truth-changing combat operations today (Phase 4A) and how that stays compatible with future server authority.

## Flow

1. Encounter UI (routes, grid, footer, drawers) gathers user input.
2. Ephemeral UI state (hover, unconfirmed target, AoE preview, modal open) stays in React state — it is **not** an authoritative combat intent.
3. When the user **confirms starting combat**, the hook builds a serializable **`CombatStartupInput`** and calls **`startEncounterFromSetup`** ([`start-encounter-from-setup.ts`](../../../../packages/mechanics/src/combat/application/start-encounter-from-setup.ts)), which delegates to engine `createEncounterState`. This is **not** a runtime `CombatIntent` — startup is initialization, not a command on existing encounter state.
4. When the user commits an **in-encounter** truth-changing action, code goes through **`applyCombatIntent`** (`packages/mechanics/src/combat/application/apply-combat-intent.ts`) with a serializable **`CombatIntent`** and an **`ApplyCombatIntentContext`** (RNG, spell lookup for turn boundaries, etc.).
5. The intent applier returns a **`CombatIntentResult`**: success with `nextState` and **`CombatEvent`** records, or structured failure (`CombatDispatchError`).
6. Encounter applies `nextState` (e.g. `setEncounterState`) and may derive toasts or log side effects from events. **Phase 4D:** log/toast registration uses `flattenLogEntriesFromIntentSuccess` so all `log-appended` chunks in one success are merged; **one** microtask per successful intent (see [`intent-success-log-entries.ts`](../../../../packages/mechanics/src/combat/application/intent-success-log-entries.ts)).

**Phase 4B:** End turn, grid movement (`move-combatant`), and action resolution (`resolve-action` → `resolveCombatAction`) all go through `applyCombatIntent`; see `apply-move-combatant-intent.ts` and `apply-resolve-action-intent.ts`.

**Phase 4C:** Documents prep vs commit ([`PHASE_4C_ACTION_PREP_VS_COMMIT.md`](../../../../packages/mechanics/src/combat/application/PHASE_4C_ACTION_PREP_VS_COMMIT.md)), hardens `apply-resolve-action-intent` slightly, adds optional `action-log-slice` events, and extracts [`build-resolve-action-intent.ts`](../../../../src/features/encounter/domain/interaction/build-resolve-action-intent.ts) for testable mapping from confirmed hook state. This is **not** a second action migration—the committed path was already unified in 4B.

**Phase 4E:** Consolidation pass — production Encounter uses **`applyCombatIntent` only** for end turn, move, and resolve (see [`MUTATION_ENTRY_POINTS.md`](../../../../packages/mechanics/src/combat/application/MUTATION_ENTRY_POINTS.md)).

**Phase 4F:** **Start encounter** uses **`startEncounterFromSetup`** with **`CombatStartupInput`** — not the runtime intent union. Optional client feedback follow-ups (`action-log-slice`, `registerIntentFailure`) remain in [feedback-followups.md](./feedback-followups.md).

## Ownership

| Concern | Owner |
|--------|--------|
| Intent / result / event types | `packages/mechanics/src/combat` (shared engine package) |
| `applyCombatIntent` | Same — pure, no React, no Encounter imports |
| `startEncounterFromSetup` / `CombatStartupInput` | Same — encounter **initialization**, not runtime intents |
| React state, routing, setup | `src/features/encounter` |
| Reusable combat UI primitives | `src/features/combat` (must not import Encounter) |

## Server authority (remote dispatch)

The same **`applyCombatIntent`** *shape* (intent in, result out) is what a server round-trip implements: the UI still builds intents and consumes results; only the transport changes. **Startup** uses the same idea: **`CombatStartupInput`** matches persisted session creation on the server.

**Current scope:** REST endpoints persist sessions and apply intents with **revision** checks; production Encounter still uses **local** mechanics by default. Realtime, permissions, and full client integration are tracked in [../roadmap.md](../roadmap.md) and [../server/authoritative-flow.md](../server/authoritative-flow.md).

## See also

- [engine/intents-and-events.md](../engine/intents-and-events.md)
- [application/MUTATION_ENTRY_POINTS.md](../../../../packages/mechanics/src/combat/application/MUTATION_ENTRY_POINTS.md) (repo path)
- [feedback-followups.md](./feedback-followups.md) — deferred `action-log-slice` / `registerIntentFailure`
