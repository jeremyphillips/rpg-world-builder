# Encounter mutation entry points

**Prep vs commit:** see [`PHASE_4C_ACTION_PREP_VS_COMMIT.md`](./PHASE_4C_ACTION_PREP_VS_COMMIT.md) (UI-local preparation vs confirmed payload vs authoritative `applyCombatIntent`).

Primary state hub: `src/features/encounter/hooks/useEncounterState.ts`.

| Flow | Handler | Engine / notes |
|------|---------|----------------|
| Start encounter | `handleStartEncounter` | `createEncounterState` directly (not seam); **deferred** — intent or dedicated applicator likely **Phase 4F+** |
| End turn | `handleNextTurn` | `applyCombatIntent` (`end-turn`) → `advanceEncounterTurn` |
| Resolve action | `handleResolveAction` | `applyCombatIntent` (`resolve-action`) → `resolveCombatAction` |
| Grid move | `handleMoveCombatant` | `applyCombatIntent` (`move-combatant`) → `moveCombatant` + reconciliation, stealth, auras |
| DM / manual | damage, healing, conditions, etc. | state mutators (not intent-dispatched yet) |
| Reset | `handleResetEncounter` | clears encounter state |

Orchestration for move/resolve/end-turn lives in [`apply-combat-intent.ts`](./apply-combat-intent.ts) and helpers (`apply-move-combatant-intent.ts`, `apply-resolve-action-intent.ts`).

Routes (`EncounterActiveRoute`, `EncounterRuntimeContext`) wire grid/footer callbacks to the handlers above.

## Phase 4D — log and toast from intent success

After a successful `applyCombatIntent`, Encounter schedules **one** `queueMicrotask` per intent (not per `log-appended` event). Log rows for UI/toast are a **single flattened** array: `flattenLogEntriesFromIntentSuccess` in [`intent-success-log-entries.ts`](./intent-success-log-entries.ts) concatenates every `log-appended` chunk in `result.events` order. The hook still exposes **`registerCombatLogAppended(entries, stateAfter)`** unchanged; the route passes flattened `entries` into `buildEncounterActionToastPayload`.

## Phase 4E — seam canonical for migrated flows

**Production:** [`useEncounterState`](../../../../encounter/hooks/useEncounterState.ts) is the only Encounter module that calls [`applyCombatIntent`](./apply-combat-intent.ts). Routes do not import `advanceEncounterTurn`, `resolveCombatAction`, or `moveCombatant` for gameplay; they call hook handlers.

**Migrated (must go through the seam):** end turn, resolve action, grid move — all use `applyCombatIntent` exclusively for truth-changing execution.

## Unmigrated truth-changing flows (explicit)

| Flow | Notes |
|------|--------|
| **Start encounter** | `createEncounterState` in hook; moving behind the seam needs startup intent/applicator + payload design — **defer to Phase 4F+** unless explicitly scoped |
| **DM / manual** | Damage, healing, conditions, states, reduced-to-zero manual hook — direct engine mutators; optional future intents or simulator-only |
| **Reset** | Clears encounter state (not an in-encounter intent) |

**Optional later:** AoE / spawn as standalone intents (often covered by `resolve-action` today).

UI-only (never authoritative intents): hover, drawer mode, unconfirmed target, AoE preview, modal open state.

**Deferred feedback docs:** [`feedback-followups.md`](../../../../../docs/reference/combat/client/feedback-followups.md) (`action-log-slice`, `registerIntentFailure`).
