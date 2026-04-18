import {
  getCreatureSenseRange,
  getDarkvisionRange,
  normalizeCreatureSenses,
} from '@/features/content/shared/domain/vocab/creatureSenses.selectors'
import type { CombatantInstance } from '@/features/mechanics/domain/combat/state/types'

import type { EncounterViewerPerceptionCapabilities } from './perception.types'

/**
 * Max darkvision range (ft) from authored combatant senses (`senses.special`), else from
 * `stats.skillRuntime.darkvisionRangeFt` when present (legacy/monster builder mirror).
 */
export function getCombatantDarkvisionRangeFt(combatant: CombatantInstance): number | undefined {
  const fromSenses =
    combatant.senses != null ? getDarkvisionRange(normalizeCreatureSenses(combatant.senses)) : undefined
  if (fromSenses != null && fromSenses > 0) return fromSenses
  const fromSkill = combatant.stats.skillRuntime?.darkvisionRangeFt
  if (fromSkill != null && fromSkill > 0) return fromSkill
  return undefined
}

/**
 * Max blindsight range (ft) from `senses.special` entries with `type: 'blindsight'`.
 */
export function getCombatantBlindsightRangeFt(combatant: CombatantInstance): number | undefined {
  if (!combatant.senses) return undefined
  return getCreatureSenseRange(normalizeCreatureSenses(combatant.senses), 'blindsight')
}

export type CombatantVisionSenseRanges = {
  darkvisionRangeFt?: number
  blindsightRangeFt?: number
}

/**
 * Darkvision and blindsight ranges from combatant senses (and darkvision skillRuntime fallback).
 */
export function getCombatantVisionSenseRanges(combatant: CombatantInstance): CombatantVisionSenseRanges {
  const darkvisionRangeFt = getCombatantDarkvisionRangeFt(combatant)
  const blindsightRangeFt = getCombatantBlindsightRangeFt(combatant)
  return {
    ...(darkvisionRangeFt != null && darkvisionRangeFt > 0 ? { darkvisionRangeFt } : {}),
    ...(blindsightRangeFt != null && blindsightRangeFt > 0 ? { blindsightRangeFt } : {}),
  }
}

/**
 * Derives viewer perception capabilities from combatant runtime data (senses + skillRuntime fallback).
 */
export function getEncounterViewerPerceptionCapabilitiesFromCombatant(
  combatant: CombatantInstance,
): EncounterViewerPerceptionCapabilities | undefined {
  const ranges = getCombatantVisionSenseRanges(combatant)
  if (Object.keys(ranges).length === 0) return undefined
  return ranges
}
