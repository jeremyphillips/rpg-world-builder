import type { CombatantInstance } from '@/features/mechanics/domain/encounter'
import { getCombatantVisionSenseRanges } from '@/features/mechanics/domain/perception/perception.capabilities'

/**
 * Single-line senses summary for encounter header (active combatant). Uses the same range derivation as
 * encounter perception (`getCombatantVisionSenseRanges` — senses.special + darkvision skillRuntime fallback).
 *
 * @returns Full line including the `Senses:` label, or `null` when the combatant has neither blindsight nor darkvision.
 */
export function formatEncounterHeaderSensesLine(combatant: CombatantInstance): string | null {
  const ranges = getCombatantVisionSenseRanges(combatant)
  const segments: string[] = []
  if (ranges.blindsightRangeFt != null && ranges.blindsightRangeFt > 0) {
    segments.push(`Blindsight ${ranges.blindsightRangeFt} ft`)
  }
  if (ranges.darkvisionRangeFt != null && ranges.darkvisionRangeFt > 0) {
    segments.push(`Darkvision ${ranges.darkvisionRangeFt} ft`)
  }
  if (segments.length === 0) return null
  return `Senses: ${segments.join(' · ')}`
}
