/**
 * Grid token render seam: combines the shared occupant-perception seam with stealth bookkeeping.
 * Does not remove combatants from state — presentation-only.
 *
 * @see canPerceiveTargetOccupantForCombat — world, LoS/LoE, conditions, invisibility
 * @see isHiddenFromObserver — observer-relative `hiddenFromObserverIds` (kept aligned by reconciliation)
 */
import type { ViewerCombatantVisibilityPresentation } from '@/features/encounter/domain'
import {
  mergeGridPerceptionInputCapabilities,
  type GridPerceptionInput,
} from '@/features/mechanics/domain/encounter/environment/perception.render.projection'
import { canPerceiveTargetOccupantForCombat } from '@/features/mechanics/domain/encounter/state/visibility/combatant-pair-visibility'
import { isHiddenFromObserver } from '@/features/mechanics/domain/encounter/state/stealth/stealth-rules'
import type { EncounterViewerPerceptionCapabilities } from '@/features/mechanics/domain/encounter/environment/perception.types'
import type { EncounterState } from '@/features/mechanics/domain/encounter/state/types'

export type { ViewerCombatantVisibilityPresentation }

export function shouldRenderOccupantTokenForEncounterViewer(
  state: EncounterState,
  params: {
    viewerCombatantId: string
    viewerRole: 'dm' | 'pc'
    occupantCombatantId: string
    capabilities?: EncounterViewerPerceptionCapabilities
  },
): boolean {
  const { viewerCombatantId, viewerRole, occupantCombatantId, capabilities } = params
  if (viewerRole === 'dm') return true
  if (viewerCombatantId === occupantCombatantId) return true
  if (!canPerceiveTargetOccupantForCombat(state, viewerCombatantId, occupantCombatantId, { capabilities })) {
    return false
  }
  if (isHiddenFromObserver(state, viewerCombatantId, occupantCombatantId)) return false
  return true
}

/**
 * Bookkeeping UI (initiative sidebar, turn-order modal): same viewer + pair + hidden seam as the grid.
 * When `input` is omitted, every id is `normal` (legacy callers).
 */
export function buildCombatantViewerVisibilityPresentationById(
  state: EncounterState,
  input: GridPerceptionInput | undefined,
  combatantIds: readonly string[],
): Record<string, ViewerCombatantVisibilityPresentation> {
  const out: Record<string, ViewerCombatantVisibilityPresentation> = {}
  if (!input) {
    for (const id of combatantIds) out[id] = 'normal'
    return out
  }
  const caps = mergeGridPerceptionInputCapabilities(input)
  for (const id of combatantIds) {
    const ok = shouldRenderOccupantTokenForEncounterViewer(state, {
      viewerCombatantId: input.viewerCombatantId,
      viewerRole: input.viewerRole,
      occupantCombatantId: id,
      capabilities: caps,
    })
    out[id] = ok ? 'normal' : 'unseen-from-viewer'
  }
  return out
}
