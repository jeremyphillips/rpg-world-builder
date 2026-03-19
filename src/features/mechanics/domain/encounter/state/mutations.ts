import type { CombatantInstance, EncounterState } from './types'
import { updateCombatant } from './shared'

export function updateEncounterCombatant(
  state: EncounterState,
  combatantId: string,
  updater: (combatant: CombatantInstance) => CombatantInstance,
): EncounterState {
  return updateCombatant(state, combatantId, updater)
}

export {
  applyDamageToCombatant,
  applyHealingToCombatant,
} from './damage-mutations'
export {
  addConditionToCombatant,
  removeConditionFromCombatant,
  addStateToCombatant,
  removeStateFromCombatant,
} from './condition-mutations'
export {
  addStatModifierToCombatant,
  expireStatModifier,
  addRollModifierToCombatant,
} from './modifier-mutations'
export {
  setConcentration,
  dropConcentration,
  tickConcentrationDuration,
} from './concentration-mutations'
export {
  addDamageResistanceMarker,
  removeDamageResistanceMarker,
} from './resistance-mutations'
