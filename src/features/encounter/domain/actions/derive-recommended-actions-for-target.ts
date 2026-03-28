import { actionRequiresCreatureTargetForResolve } from '@/features/mechanics/domain/encounter'
import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'

import { deriveActionPresentation } from './action-presentation'

const MAX_RECOMMENDED = 3

function hasSequence(action: CombatActionDefinition): boolean {
  return action.sequence != null && action.sequence.length > 0
}

const CATEGORY_SORT_PRIORITY: Record<string, number> = {
  attack: 0,
  heal: 1,
  buff: 2,
  utility: 3,
  item: 4,
}

/**
 * Short list of actions that make sense **for the selected target** (attacks, targeted spells, etc.).
 * Excludes self-only / AoE / no-target actions (e.g. Hide) so they stay in category groups only.
 */
export function deriveRecommendedActionsForTarget(
  actions: CombatActionDefinition[],
  availableActionIds: Set<string> | undefined,
  validActionIdsForTarget: Set<string> | undefined,
): CombatActionDefinition[] {
  if (validActionIdsForTarget == null) return []

  const allTreatAsAvailable = availableActionIds == null

  const candidates = actions.filter((a) => {
    if (!actionRequiresCreatureTargetForResolve(a)) return false
    const resourceAvailable = allTreatAsAvailable || availableActionIds!.has(a.id)
    const validForTarget = validActionIdsForTarget.has(a.id)
    return resourceAvailable && validForTarget
  })

  if (candidates.length === 0) return []

  const multiattackChildLabels = new Set<string>()
  for (const c of candidates) {
    if (hasSequence(c)) {
      for (const step of c.sequence!) {
        multiattackChildLabels.add(step.actionLabel)
      }
    }
  }

  const hasMultiattack = multiattackChildLabels.size > 0
  const filtered = hasMultiattack
    ? candidates.filter((c) => hasSequence(c) || !multiattackChildLabels.has(c.label))
    : candidates

  filtered.sort((a, b) => {
    const aSeq = hasSequence(a) ? 0 : 1
    const bSeq = hasSequence(b) ? 0 : 1
    if (aSeq !== bSeq) return aSeq - bSeq

    const aCat = CATEGORY_SORT_PRIORITY[deriveActionPresentation(a).category] ?? 99
    const bCat = CATEGORY_SORT_PRIORITY[deriveActionPresentation(b).category] ?? 99
    if (aCat !== bCat) return aCat - bCat

    return a.label.localeCompare(b.label)
  })

  return filtered.slice(0, MAX_RECOMMENDED)
}
