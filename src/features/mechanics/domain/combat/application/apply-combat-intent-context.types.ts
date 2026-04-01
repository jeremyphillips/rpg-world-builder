import type { AdvanceEncounterTurnOptions } from '../state/runtime'
import type { ResolveCombatActionOptions } from '../resolution/action-resolution.types'
import type { BattlefieldSpellContext } from '../state/battlefield/battlefield-spatial-movement-modifiers'
import type { BattlefieldSpatialEntryResolutionOptions } from '../state/battlefield/battlefield-spatial-entry-resolution'

/**
 * Dependencies for applying intents locally. Same shape can later be satisfied by a server round-trip
 * (serialized intents + server-provided options).
 */
export type ApplyCombatIntentContext = {
  /** Passed to {@link advanceEncounterTurn} for `end-turn` intents. */
  advanceEncounterTurnOptions?: AdvanceEncounterTurnOptions
  /** Passed to {@link resolveCombatAction} for `resolve-action` intents. */
  resolveCombatActionOptions?: ResolveCombatActionOptions
  /** Passed to {@link moveCombatant} for `move-combatant` intents (spatial speed / attached auras). */
  moveCombatantSpellContext?: BattlefieldSpellContext
  /** When set, runs {@link resolveAttachedAuraSpatialEntryAfterMovement} after anchor reconciliation. */
  spatialEntryAfterMove?: BattlefieldSpatialEntryResolutionOptions
}
