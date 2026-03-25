import type { CombatantInstance } from '@/features/mechanics/domain/encounter'

import { buildEncounterDefensePreviewChips, type PreviewChip } from '../domain'
import { CONCENTRATING_BADGE_TOOLTIP, tooltipForConditionMarkerLabel } from './combatant-card-tooltips'

export type BuildCombatantPreviewChipsOptions = {
  /** Max condition chips (after concentration). Omit = all conditions. */
  maxConditions?: number
  /** Include runtime state markers. Default `true` (preview cards); use `false` for compact header chips. */
  includeStates?: boolean
  /** Max defense-derived chips. Omit = all. */
  maxDefenseChips?: number
  /** Cap total chips after ordering (concentration → conditions → states → defense). Omit = no cap. */
  maxTotalChips?: number
  /** Attach tooltips where defined. Default `true`. */
  includeTooltips?: boolean
}

const CONCENTRATING_CHIP: Omit<PreviewChip, 'tooltip'> = {
  id: 'concentrating',
  label: 'Concentrating',
  tone: 'info',
}

/**
 * Ordered preview chips shared by combatant preview cards and compact identity rows.
 * Order: concentration → conditions → states → defense badges.
 */
export function buildCombatantPreviewChips(
  combatant: CombatantInstance,
  options?: BuildCombatantPreviewChipsOptions,
): PreviewChip[] {
  const {
    maxConditions,
    includeStates = true,
    maxDefenseChips,
    maxTotalChips,
    includeTooltips = true,
  } = options ?? {}

  const concentration: PreviewChip[] = combatant.concentration
    ? [
        {
          ...CONCENTRATING_CHIP,
          ...(includeTooltips ? { tooltip: CONCENTRATING_BADGE_TOOLTIP } : {}),
        },
      ]
    : []

  const conditionSource =
    maxConditions != null ? combatant.conditions.slice(0, maxConditions) : combatant.conditions

  const conditions: PreviewChip[] = conditionSource.map((c) => ({
    id: c.id,
    label: c.label,
    tone: 'warning' as const,
    ...(includeTooltips ? { tooltip: tooltipForConditionMarkerLabel(c.label) } : {}),
  }))

  const states: PreviewChip[] = includeStates
    ? combatant.states.map((s) => ({ id: s.id, label: s.label, tone: 'info' as const }))
    : []

  let defense = buildEncounterDefensePreviewChips(combatant)
  if (maxDefenseChips != null) {
    defense = defense.slice(0, maxDefenseChips)
  }

  const combined = [...concentration, ...conditions, ...states, ...defense]
  if (maxTotalChips != null) {
    return combined.slice(0, maxTotalChips)
  }
  return combined
}
