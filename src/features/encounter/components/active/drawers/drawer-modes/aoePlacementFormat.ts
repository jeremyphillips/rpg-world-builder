import type { CombatActionAreaTemplate } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'

export function formatAreaTemplateLabel(t: CombatActionAreaTemplate): string {
  if (t.kind === 'sphere') return `${t.radiusFt} ft sphere`
  return `${t.edgeFt} ft cube`
}

/** Spell display line e.g. "Range 150 ft" from action.displayMeta when present. */
export function formatSpellRangeLine(action: {
  displayMeta?: { source?: string; range?: string }
  targeting?: { rangeFt?: number }
}): string {
  if (action.displayMeta?.source === 'spell' && action.displayMeta.range) {
    return `Range ${action.displayMeta.range}`
  }
  if (action.targeting?.rangeFt != null) {
    return `Range ${action.targeting.rangeFt} ft`
  }
  return 'Range —'
}
