/**
 * Single affordance model for combat grid cells: host semantics, cursor, and hover-mode input for
 * {@link getCellVisualState}. Replaces ad hoc `clickable` + inline cursor logic in {@link CombatGrid}.
 */
import type { GridCellViewModel } from '@/features/mechanics/domain/combat/space/selectors/space.selectors'

export type CombatCellHoverMode = 'none' | 'legal' | 'illegal'

export type CombatCellCursor = 'pointer' | 'default' | 'not-allowed'

export type CombatCellAffordance = {
  /** Native `<button>` host when true; `div` for walls / cells with no cell-click handler. */
  interactive: boolean
  /** Click / keyboard activation should commit the current cell action (false when hovered illegal). */
  activatable: boolean
  /** Native `disabled` on `<button>` when interactive and not activatable (illegal hover). */
  disabled: boolean
  cursor: CombatCellCursor
  /** Drives tactical hover emphasis in {@link getCellVisualState} (`combatHoverMode`). */
  hoverMode: CombatCellHoverMode
}

export type ResolveCombatCellAffordanceInput = {
  cell: GridCellViewModel
  hoveredCellId: string | null | undefined
  /** Same as `Boolean(onCellClick)` from CombatGrid props. */
  hasCellClickHandler: boolean
  movementHighlightActive: boolean
  hasMovementRemaining: boolean
  creatureTargetingActive: boolean
  singleCellPlacementPickActive: boolean
  objectAnchorPickActive: boolean
}

function isWallCell(cell: GridCellViewModel): boolean {
  return cell.kind === 'wall' || cell.kind === 'blocking'
}

/**
 * True when this cell is hovered and the current mode treats the hover as illegal (cursor `not-allowed`).
 */
function isIllegalHover(input: ResolveCombatCellAffordanceInput): boolean {
  const { cell, hoveredCellId, movementHighlightActive, hasMovementRemaining, creatureTargetingActive,
    singleCellPlacementPickActive, objectAnchorPickActive } = input
  const isHover = Boolean(hoveredCellId && hoveredCellId === cell.cellId)
  if (!isHover) return false

  const isWall = isWallCell(cell)

  if (singleCellPlacementPickActive) {
    if (cell.placementInvalidHover) return true
  }

  if (objectAnchorPickActive) {
    const obstaclePerceivable =
      Boolean(cell.placedObjectKind) && cell.perception?.showObstacleGlyph !== false
    if (!obstaclePerceivable) return true
  }

  const movementIllegal =
    movementHighlightActive &&
    hasMovementRemaining &&
    !cell.occupantId &&
    !isWall &&
    !cell.isReachable

  const targetingIllegalOccupant =
    creatureTargetingActive &&
    Boolean(cell.occupantId) &&
    !cell.isLegalTargetForSelectedAction

  const targetingIllegalEmpty =
    creatureTargetingActive && !cell.occupantId && !isWall

  return movementIllegal || targetingIllegalOccupant || targetingIllegalEmpty
}

function resolveCursor(input: ResolveCombatCellAffordanceInput, interactive: boolean): CombatCellCursor {
  const {
    cell,
    hoveredCellId,
    movementHighlightActive,
    hasMovementRemaining,
    creatureTargetingActive,
    singleCellPlacementPickActive,
    objectAnchorPickActive,
  } = input

  const isHover = Boolean(hoveredCellId && hoveredCellId === cell.cellId)
  const isWall = isWallCell(cell)

  if (isHover) {
    if (singleCellPlacementPickActive) {
      if (cell.placementInvalidHover) return 'not-allowed'
      if (cell.placementCastRange && !isWall) return 'pointer'
    }

    if (objectAnchorPickActive) {
      const obstaclePerceivable =
        Boolean(cell.placedObjectKind) && cell.perception?.showObstacleGlyph !== false
      return obstaclePerceivable ? 'pointer' : 'not-allowed'
    }

    const movementIllegal =
      movementHighlightActive &&
      hasMovementRemaining &&
      !cell.occupantId &&
      !isWall &&
      !cell.isReachable

    const targetingIllegalOccupant =
      creatureTargetingActive &&
      Boolean(cell.occupantId) &&
      !cell.isLegalTargetForSelectedAction

    const targetingIllegalEmpty =
      creatureTargetingActive && !cell.occupantId && !isWall

    if (movementIllegal || targetingIllegalOccupant || targetingIllegalEmpty) {
      return 'not-allowed'
    }
  }

  if (interactive) return 'pointer'
  return 'default'
}

/**
 * Derives host semantics, cursor, and per-cell hover mode from tactical inputs shared with visual state.
 */
export function resolveCombatCellAffordance(
  input: ResolveCombatCellAffordanceInput,
): CombatCellAffordance {
  const { cell, hoveredCellId, hasCellClickHandler } = input
  const isWall = isWallCell(cell)
  const isHover = Boolean(hoveredCellId && hoveredCellId === cell.cellId)

  const interactive = !isWall && hasCellClickHandler
  const illegalHover = isIllegalHover(input)

  const hoverMode: CombatCellHoverMode = !isHover
    ? 'none'
    : isWall
      ? 'none'
      : illegalHover
        ? 'illegal'
        : 'legal'

  const activatable = interactive && !(isHover && illegalHover)
  const disabled = interactive && !activatable

  return {
    interactive,
    activatable,
    disabled,
    cursor: resolveCursor(input, interactive),
    hoverMode,
  }
}
