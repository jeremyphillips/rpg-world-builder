/**
 * Grid + bookkeeping **presentation** seam: maps existing rule outputs to viewer-facing labels.
 * Does not implement stealth/perception rules — only derives presentation from:
 * - {@link canPerceiveTargetOccupantForCombat}
 * - {@link isHiddenFromObserver}
 * - viewer role (DM omniscience, self)
 *
 * @see canPerceiveTargetOccupantForCombat — world, LoS/LoE, conditions, invisibility
 * @see isHiddenFromObserver — observer-relative `hiddenFromObserverIds`
 */
import type { ViewerCombatantPresentationKind } from '@/features/encounter/domain'
import {
  mergeGridPerceptionInputCapabilities,
  type GridPerceptionInput,
} from '@/features/mechanics/domain/perception/perception.render.projection'
import { canPerceiveTargetOccupantForCombat } from '@/features/mechanics/domain/encounter/state/visibility/combatant-pair-visibility'
import { isHiddenFromObserver } from '@/features/mechanics/domain/encounter/state/stealth/stealth-rules'
import type { EncounterViewerPerceptionCapabilities } from '@/features/mechanics/domain/perception/perception.types'
import type { EncounterState } from '@/features/mechanics/domain/encounter/state/types'

export type { ViewerCombatantPresentationKind }

/**
 * Presentation precedence (presentation layer only; does not change mechanics or reconciliation):
 *
 * 1. **DM viewer** → `visible` (omniscient tactical presentation).
 * 2. **Self** → `visible`.
 * 3. **`isHiddenFromObserver`** → **`hidden`** — observer-relative Hide / `hiddenFromObserverIds`
 *    surfaces first so successful Hide is distinct in UI even when pair perception would also fail
 *    (e.g. blocked LOS + still on hidden list).
 * 4. **`!canPerceiveTargetOccupantForCombat`** → **`out-of-sight`** — generic geometry / lighting /
 *    conditions / invisibility without stealth hidden-from-observer for this pair.
 * 5. Else → **`visible`**.
 *
 * **Strict POV token rendering:** {@link shouldRenderOccupantTokenForEncounterViewer} still renders
 * a normal token only when kind is `visible` (both `hidden` and `out-of-sight` suppress). Future
 * relaxed POV can branch on kind without changing `canPerceiveTargetOccupantForCombat` or stealth rules.
 */
export function deriveViewerCombatantPresentationKind(
  state: EncounterState,
  params: {
    viewerCombatantId: string
    viewerRole: 'dm' | 'pc'
    occupantCombatantId: string
    capabilities?: EncounterViewerPerceptionCapabilities
  },
): ViewerCombatantPresentationKind {
  const { viewerCombatantId, viewerRole, occupantCombatantId, capabilities } = params
  if (viewerRole === 'dm') return 'visible'
  if (viewerCombatantId === occupantCombatantId) return 'visible'
  if (isHiddenFromObserver(state, viewerCombatantId, occupantCombatantId)) return 'hidden'
  if (!canPerceiveTargetOccupantForCombat(state, viewerCombatantId, occupantCombatantId, { capabilities })) {
    return 'out-of-sight'
  }
  return 'visible'
}

/** Strict POV: render normal token only when presentation is `visible`. */
export function shouldRenderOccupantTokenForEncounterViewer(
  state: EncounterState,
  params: {
    viewerCombatantId: string
    viewerRole: 'dm' | 'pc'
    occupantCombatantId: string
    capabilities?: EncounterViewerPerceptionCapabilities
  },
): boolean {
  return deriveViewerCombatantPresentationKind(state, params) === 'visible'
}

/**
 * Bookkeeping UI (initiative sidebar, turn-order modal, header). Same viewer input as grid.
 * When `input` is omitted, every id is `visible` (legacy callers without POV).
 */
export function buildCombatantViewerPresentationKindById(
  state: EncounterState,
  input: GridPerceptionInput | undefined,
  combatantIds: readonly string[],
): Record<string, ViewerCombatantPresentationKind> {
  const out: Record<string, ViewerCombatantPresentationKind> = {}
  if (!input) {
    for (const id of combatantIds) out[id] = 'visible'
    return out
  }
  const caps = mergeGridPerceptionInputCapabilities(input)
  for (const id of combatantIds) {
    out[id] = deriveViewerCombatantPresentationKind(state, {
      viewerCombatantId: input.viewerCombatantId,
      viewerRole: input.viewerRole,
      occupantCombatantId: id,
      capabilities: caps,
    })
  }
  return out
}
