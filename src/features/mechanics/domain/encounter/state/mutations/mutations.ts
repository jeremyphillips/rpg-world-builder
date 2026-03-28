import type { CombatantInstance, EncounterState } from '../types'
import { updateCombatant } from '../shared'

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
  removeStatesByClassification,
} from '../conditions/condition-mutations'
export {
  addStatModifierToCombatant,
  expireStatModifier,
  addRollModifierToCombatant,
} from '../effects/modifier-mutations'
export {
  setConcentration,
  dropConcentration,
  tickConcentrationDuration,
} from '../effects/concentration-mutations'
export {
  addDamageResistanceMarker,
  removeDamageResistanceMarker,
} from '../effects/resistance-mutations'
export { patchCombatantEquipmentSnapshot } from './equipment-mutations'
export { updateEncounterEnvironmentBaseline } from '../environment/environment-baseline-mutations'
