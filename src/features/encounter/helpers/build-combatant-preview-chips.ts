import type { CombatantInstance } from '@/features/mechanics/domain/encounter'
import { isDefeatedCombatant } from '@/features/mechanics/domain/encounter/state/combatant-participation'
import type { CombatStatePriority } from '../domain/effects/presentable-effects.types'

import {
  buildEncounterDefensePreviewChips,
  resolvePresentationForSemanticKey,
  type PreviewChip,
} from '../domain'
import { CONCENTRATING_BADGE_TOOLTIP, tooltipForConditionMarkerLabel } from './combatant-card-tooltips'
import { formatTurnDuration } from './format-turn-duration'

export type BuildCombatantPreviewChipsOptions = {
  /** Max condition chips. Omit = all conditions. */
  maxConditions?: number
  /** Include runtime state markers. Default `true` (preview cards); use `false` for compact header chips. */
  includeStates?: boolean
  /** Max defense-derived chips. Omit = all. */
  maxDefenseChips?: number
  /** Skip innate stat-block defenses. Default `true` for preview cards. */
  excludeGrantedDefenses?: boolean
  /** Skip damage-vulnerability badges. Default `true` for preview cards. */
  excludeVulnerabilities?: boolean
}

const PRIORITY_RANK: Record<CombatStatePriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
  hidden: 4,
}

/** Normalizes a semantic id or label for map lookup. Prefer `marker.id` when available. */
function normalizeMarkerKey(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, '_')
}

/**
 * Priority-driven preview chips shared by combatant preview cards and compact identity rows.
 *
 * Pipeline:
 *   1. Collect candidates: bloodied → concentration → conditions → states → defense
 *   2. Assign priority + tone from COMBAT_STATE_UI_MAP
 *   3. Attach tooltips and time labels
 *   4. Sort by priority (critical first)
 */
export function buildCombatantPreviewChips(
  combatant: CombatantInstance,
  options?: BuildCombatantPreviewChipsOptions,
): PreviewChip[] {
  const {
    maxConditions,
    includeStates = true,
    maxDefenseChips,
    excludeGrantedDefenses = true,
    excludeVulnerabilities = true,
  } = options ?? {}

  const candidates: PreviewChip[] = []

  if (isDefeatedCombatant(combatant)) {
    const defeatedPres = resolvePresentationForSemanticKey('participation_defeated')
    candidates.push({
      id: 'participation-defeated',
      label: defeatedPres.label,
      tone: defeatedPres.tone,
      priority: defeatedPres.priority,
      tooltip: 'HP 0 — out of combat',
    })
  }

  // Bloodied (derived from HP threshold)
  const isBloodied =
    combatant.stats.currentHitPoints > 0 &&
    combatant.stats.currentHitPoints <= combatant.stats.maxHitPoints / 2
  if (isBloodied) {
    const bloodiedPres = resolvePresentationForSemanticKey('bloodied')
    candidates.push({
      id: 'bloodied',
      label: bloodiedPres.label,
      tone: bloodiedPres.tone,
      priority: bloodiedPres.priority,
      tooltip: `HP at or below 50% (${combatant.stats.currentHitPoints}/${combatant.stats.maxHitPoints})`,
    })
  }

  // Concentration
  if (combatant.concentration) {
    const { remainingTurns, totalTurns } = combatant.concentration
    const timeLabel =
      remainingTurns != null && totalTurns != null
        ? formatTurnDuration({ remainingTurns, totalTurns })
        : undefined
    const concPres = resolvePresentationForSemanticKey('concentrating')
    candidates.push({
      id: 'concentrating',
      label: concPres.label,
      tone: concPres.tone,
      priority: concPres.priority,
      tooltip: CONCENTRATING_BADGE_TOOLTIP,
      timeLabel,
    })
  }

  // Conditions
  const conditionSource =
    maxConditions != null ? combatant.conditions.slice(0, maxConditions) : combatant.conditions
  for (const c of conditionSource) {
    const semanticKey = normalizeMarkerKey(c.id)
    const presentation = resolvePresentationForSemanticKey(semanticKey, { rawLabel: c.label })
    const timeLabel = c.duration
      ? formatTurnDuration({ remainingTurns: c.duration.remainingTurns })
      : undefined
    candidates.push({
      id: c.id,
      label: presentation.label,
      tone: presentation.tone,
      priority: presentation.priority,
      tooltip: tooltipForConditionMarkerLabel(semanticKey),
      timeLabel,
    })
  }

  // States
  if (includeStates) {
    for (const s of combatant.states) {
      const semanticKey = normalizeMarkerKey(s.id)
      const presentation = resolvePresentationForSemanticKey(semanticKey, { rawLabel: s.label })
      const timeLabel = s.duration
        ? formatTurnDuration({ remainingTurns: s.duration.remainingTurns })
        : undefined
      candidates.push({
        id: s.id,
        label: presentation.label,
        tone: presentation.tone,
        priority: presentation.priority,
        timeLabel,
      })
    }
  }

  // Defense badges (combat-acquired only by default)
  let defense = buildEncounterDefensePreviewChips(combatant, {
    excludeGranted: excludeGrantedDefenses,
    excludeVulnerabilities,
  })
  if (maxDefenseChips != null) {
    defense = defense.slice(0, maxDefenseChips)
  }
  candidates.push(...defense)

  // Sort by priority (critical first)
  candidates.sort(
    (a, b) => PRIORITY_RANK[a.priority ?? 'normal'] - PRIORITY_RANK[b.priority ?? 'normal'],
  )

  return candidates
}
