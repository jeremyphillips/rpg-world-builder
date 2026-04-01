# Encounter mutation entry points

**Prep vs commit:** see [`PHASE_4C_ACTION_PREP_VS_COMMIT.md`](./PHASE_4C_ACTION_PREP_VS_COMMIT.md) (UI-local preparation vs confirmed payload vs authoritative `applyCombatIntent`).

Primary state hub: `src/features/encounter/hooks/useEncounterState.ts`.

| Flow | Handler | Engine / notes |
|------|---------|----------------|
| Start encounter | `handleStartEncounter` | `createEncounterState` |
| End turn | `handleNextTurn` | `applyCombatIntent` (`end-turn`) → `advanceEncounterTurn` |
| Resolve action | `handleResolveAction` | `applyCombatIntent` (`resolve-action`) → `resolveCombatAction` |
| Grid move | `handleMoveCombatant` | `applyCombatIntent` (`move-combatant`) → `moveCombatant` + reconciliation, stealth, auras |
| DM / manual | damage, healing, conditions, etc. | state mutators (not intent-dispatched yet) |
| Reset | `handleResetEncounter` | clears encounter state |

Orchestration for move/resolve/end-turn lives in [`apply-combat-intent.ts`](./apply-combat-intent.ts) and helpers (`apply-move-combatant-intent.ts`, `apply-resolve-action-intent.ts`).

Routes (`EncounterActiveRoute`, `EncounterRuntimeContext`) wire grid/footer callbacks to the handlers above.

## Later migration (4D+)

| Area | Notes |
|------|--------|
| AoE / spawn as standalone intents | Optional; today folded into `resolve-action` selection |
| DM manual mutators | Could become intents or stay simulator-only |
| Log/toast | Derive from `CombatEvent` records (4D) |

UI-only (never authoritative intents): hover, drawer mode, unconfirmed target, AoE preview, modal open state.
