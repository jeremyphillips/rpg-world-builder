import type { CombatantInstance } from '@/features/mechanics/domain/encounter/state/types'

import type { EncounterViewerPerceptionCapabilities } from './perception.types'

/**
 * Max darkvision range (ft) from authored combatant senses (`senses.special`), else from
 * `stats.skillRuntime.darkvisionRangeFt` when present (legacy/monster builder mirror).
 */
export function getCombatantDarkvisionRangeFt(combatant: CombatantInstance): number | undefined {
  const special = combatant.senses?.special
  if (special?.length) {
    let max = 0
    for (const s of special) {
      if (s.type === 'darkvision' && typeof s.range === 'number' && s.range > max) max = s.range
    }
    if (max > 0) return max
  }
  const fromSkill = combatant.stats.skillRuntime?.darkvisionRangeFt
  if (fromSkill != null && fromSkill > 0) return fromSkill
  return undefined
}

/**
 * Derives viewer perception capabilities from combatant runtime data (senses + skillRuntime fallback).
 */
export function getEncounterViewerPerceptionCapabilitiesFromCombatant(
  combatant: CombatantInstance,
): EncounterViewerPerceptionCapabilities | undefined {
  const r = getCombatantDarkvisionRangeFt(combatant)
  if (r == null || r <= 0) return undefined
  return { darkvisionRangeFt: r }
}
