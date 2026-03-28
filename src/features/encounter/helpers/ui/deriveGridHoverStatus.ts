import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter'
import { getActionTargetInvalidReason } from '@/features/mechanics/domain/encounter/resolution/action/action-targeting'
import type { EncounterState } from '@/features/mechanics/domain/encounter/state/types'

import { isAreaGridAction, isSelfCenteredAreaAction } from '../actions'
import type { GridInteractionMode } from '../../domain/interaction/encounter-interaction.types'
import {
  getSingleCellPlacementRequirement,
  validateSingleCellPlacement,
} from '@/features/mechanics/domain/encounter/resolution/action/action-requirement-model'
import { getCellById, getCellForCombatant, gridDistanceFt } from '../../space/space.helpers'
import {
  actionUsesGridCreatureTargeting,
  getMoveRejectionReason,
  isValidAoeOriginCell,
} from '../../space/selectors/space.selectors'

export type AoeStep = 'none' | 'placing' | 'confirm'

/** Map verbose mechanics strings to short grid status copy. */
export function mapMechanicsReasonToGridStatus(reason: string | null | undefined): string | null {
  if (!reason) return null
  const t = reason.trim()
  const table: Record<string, string> = {
    'Out of range': 'Out of range',
    'Requires enemy target': 'Requires enemy target',
    'Requires willing ally': 'Requires ally target',
    'Target is defeated': 'Invalid target',
    'Target is banished': 'Invalid target',
    'Target not visible': 'No line of sight',
    'Cannot target (charmed)': 'Cannot target',
    'Invalid creature type': 'Wrong target type',
    'Requires dead creature': 'Requires dead target',
    'Remains destroyed': 'Invalid target',
  }
  if (table[t]) return table[t]
  if (t.length > 48) return `${t.slice(0, 45)}…`
  return t
}

function aoeInvalidOriginShortMessage(
  state: EncounterState,
  casterCellId: string,
  hoverCellId: string,
  castRangeFt: number,
): string {
  const space = state.space
  if (!space) return 'Blocked'
  const cell = getCellById(space, hoverCellId)
  if (!cell || cell.kind === 'wall' || cell.kind === 'blocking') return 'Blocked'
  const d = gridDistanceFt(space, casterCellId, hoverCellId)
  if (d === undefined || d > castRangeFt) return 'Out of range'
  return 'Blocked'
}

export function deriveGridHoverStatusMessage(params: {
  encounterState: EncounterState | undefined | null
  activeCombatantId: string | null
  activeCombatant: CombatantInstance | null
  hoveredCellId: string | null
  selectedAction: CombatActionDefinition | null
  /** For {@link CombatActionDefinition.attachedEmanation} `place-or-object`. */
  selectedCasterOptions?: Record<string, string>
  aoeStep: AoeStep
  /** Same condition as movement reach highlights on the grid (off during AoE placement). */
  movementHighlightActive: boolean
  interactionMode?: GridInteractionMode
}): string | null {
  const {
    encounterState,
    activeCombatantId,
    activeCombatant,
    hoveredCellId,
    selectedAction,
    selectedCasterOptions,
    aoeStep,
    movementHighlightActive,
    interactionMode,
  } =
    params
  if (!encounterState || !hoveredCellId || !activeCombatantId || !activeCombatant) return null

  const space = encounterState.space
  const placements = encounterState.placements
  if (!space || !placements) return null


  if (interactionMode === 'single-cell-place' && selectedAction) {
    const req = getSingleCellPlacementRequirement(selectedAction)
    if (req) {
      const casterCell = getCellForCombatant(placements, activeCombatantId)
      if (casterCell) {
        const v = validateSingleCellPlacement(space, placements, casterCell, hoveredCellId, req)
        if (!v.isValid) {
          const r = v.reasons[0]
          if (r === 'out-of-range') return 'Out of range'
          if (r === 'no-line-of-sight') return 'No line of sight'
          if (r === 'occupied') return 'Occupied'
          if (r === 'invalid-terrain') return 'Blocked'
          return 'Invalid placement'
        }
      }
    }
    return null
  }

  if (interactionMode === 'object-anchor-select') {
    const obstacles = encounterState.space?.obstacles
    if (!obstacles?.length) return 'No obstacles on this map'
    const obs = obstacles.find((o) => o.cellId === hoveredCellId)
    if (!obs) return 'Select a tree or pillar'
    return null
  }

  if (
    (aoeStep === 'placing' || aoeStep === 'confirm') &&
    selectedAction &&
    isAreaGridAction(selectedAction, selectedCasterOptions) &&
    !isSelfCenteredAreaAction(selectedAction, selectedCasterOptions)
  ) {
    const casterCell = getCellForCombatant(placements, activeCombatantId)
    const castRangeFt = selectedAction.targeting?.rangeFt ?? 0
    if (casterCell) {
      const valid = isValidAoeOriginCell(space, casterCell, hoveredCellId, castRangeFt)
      if (!valid) {
        return aoeInvalidOriginShortMessage(encounterState, casterCell, hoveredCellId, castRangeFt)
      }
    }
    return null
  }

  const hoveredCell = getCellById(space, hoveredCellId)
  const occupantId = placements.find((p) => p.cellId === hoveredCellId)?.combatantId ?? null

  const creatureTargeting =
    Boolean(selectedAction) && actionUsesGridCreatureTargeting(selectedAction)

  if (creatureTargeting && selectedAction) {
    if (!occupantId) {
      const isWall = hoveredCell?.kind === 'wall' || hoveredCell?.kind === 'blocking'
      if (isWall) return 'Blocked'
      return 'No valid target'
    }
    const target = encounterState.combatantsById[occupantId]
    if (!target) return null
    const reason = getActionTargetInvalidReason(encounterState, target, activeCombatant, selectedAction)
    if (reason) return mapMechanicsReasonToGridStatus(reason)
    return null
  }

  if (!movementHighlightActive) return null

  const movementRemaining = activeCombatant.turnResources?.movementRemaining ?? 0
  if (movementRemaining <= 0) return null
  if (occupantId) return null

  return getMoveRejectionReason(encounterState, activeCombatantId, hoveredCellId)
}
