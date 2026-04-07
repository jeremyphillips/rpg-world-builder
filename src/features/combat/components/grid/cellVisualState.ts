import type { EncounterGridCellRenderState } from '@/features/mechanics/domain/perception/perception.render.projection'
import type { VisibilityFillKind } from '@/features/mechanics/domain/perception/visibility.types'

import type { GridCellViewModel } from '@/features/mechanics/domain/combat/space/selectors/space.selectors'

import type { CombatCellHoverMode } from './combatCellAffordance'

/**
 * Resolved base fill / overlay intent (top-down precedence). Used by {@link getCellVisualSx}.
 * `aoe-cast-range` is first-class: cast-range band when no higher-priority tint applies (style map may use paper-equivalent fill).
 *
 * {@link VisibilityFillKind} values are **presentation-only** tints from viewer perception projection — not tactical rules.
 */
export type CellBaseFillKind =
  | 'blocked'
  | 'placement-invalid-hover'
  | 'placement-selected'
  | 'placement-cast-range'
  | 'aoe-invalid-origin-hover'
  | 'aoe-origin-locked'
  | 'aoe-template'
  | 'aoe-cast-range'
  | 'persistent-attached-aura'
  | 'paper'
  | VisibilityFillKind

/**
 * Movement emphasis on top of base fill. Mutually exclusive branches match legacy CombatGrid behavior.
 */
export type CellMovementVisual =
  | 'none'
  | 'rejected-hover'
  | 'reachable-fill-strong'
  | 'reachable-fill-weak'
  | 'reachable-border-only'
  /** Same as border-only but thicker inset ring when hovered (overlay suppresses movement fill). */
  | 'reachable-border-only-hover'

export type CellVisualContext = {
  hoveredCellId: string | null | undefined
  movementHighlightActive: boolean
  hasMovementRemaining: boolean
  /**
   * From {@link resolveCombatCellAffordance} per cell. When `'illegal'`, suppresses positive movement
   * hover emphasis (strong fill / border-only-hover) while keeping unreachable rejected-hover.
   */
  combatHoverMode?: CombatCellHoverMode
}

export type CellVisualState = {
  baseFillKind: CellBaseFillKind
  /** When true, reachable movement uses border-only (green outline) without movement fill — same set as legacy “overlay suppression”. */
  movementFillSuppressedByOverlay: boolean
  movementVisual: CellMovementVisual
}

/** Which overlay kinds suppress the green movement fill (reachable still shows light border when in range). */
export function movementFillSuppressedByOverlay(cell: GridCellViewModel): boolean {
  return Boolean(
    cell.placementInvalidHover ||
      cell.placementSelected ||
      cell.placementCastRange ||
      cell.aoeInvalidOriginHover ||
      cell.aoeOriginLocked ||
      cell.aoeInTemplate ||
      cell.aoeCastRange,
  )
}

/**
 * Single precedence chain for base fill (mirrors former `cellColor`), then `aoe-cast-range` when in cast band only.
 */
export function resolveBaseFillKind(cell: GridCellViewModel): CellBaseFillKind {
  if (cell.kind === 'wall') return 'blocked'
  /** Structural blocking terrain — not a cell with a runtime placed object, which keeps authored floor + glyph. */
  if (cell.kind === 'blocking' && cell.placedObjectKind == null) return 'blocked'
  if (cell.placementInvalidHover) return 'placement-invalid-hover'
  if (cell.placementSelected) return 'placement-selected'
  if (cell.placementCastRange) return 'placement-cast-range'
  if (cell.aoeInvalidOriginHover) return 'aoe-invalid-origin-hover'
  if (cell.aoeOriginLocked) return 'aoe-origin-locked'
  if (cell.aoeInTemplate) return 'aoe-template'
  if (cell.aoeCastRange) return 'aoe-cast-range'
  if (cell.persistentAttachedAura) return 'persistent-attached-aura'
  return 'paper'
}

/**
 * Derives consolidated cell visuals for the combat grid. Pure — no palette / theme.
 */
export function getCellVisualState(cell: GridCellViewModel, ctx: CellVisualContext): CellVisualState {
  const isWall = cell.kind === 'wall' || cell.kind === 'blocking'
  const isHoverCell = Boolean(ctx.hoveredCellId && ctx.hoveredCellId === cell.cellId)
  const movementMode =
    ctx.movementHighlightActive && ctx.hasMovementRemaining && !isWall

  const showReachableMovementBorder = movementMode && cell.isReachable

  const suppressMovementFill = movementFillSuppressedByOverlay(cell)

  const movementRejectedHover =
    movementMode && isHoverCell && !cell.occupantId && !cell.isReachable

  /** Suppress green “active target” hover emphasis when affordance marks hover illegal (targeting/placement). */
  const positiveMovementHover =
    isHoverCell && ctx.combatHoverMode !== 'illegal'

  let movementVisual: CellMovementVisual = 'none'
  if (movementRejectedHover) {
    movementVisual = 'rejected-hover'
  } else if (showReachableMovementBorder) {
    if (suppressMovementFill) {
      movementVisual =
        positiveMovementHover && cell.isReachable ? 'reachable-border-only-hover' : 'reachable-border-only'
    } else if (positiveMovementHover && cell.isReachable) {
      movementVisual = 'reachable-fill-strong'
    } else {
      movementVisual = 'reachable-fill-weak'
    }
  }

  return {
    baseFillKind: resolveBaseFillKind(cell),
    movementFillSuppressedByOverlay: suppressMovementFill,
    movementVisual,
  }
}

export type MergePerceptionIntoCellVisualOptions = {
  /**
   * When true (PC viewer immersed in heavy obscurement / MD — same condition as
   * `EncounterBattlefieldRenderState.suppressAoeTemplateOverlay`), allow canonical visibility fills to
   * replace **cast-range band** bases (`aoe-cast-range`, `placement-cast-range`). Without this, those
   * bands use paper-equivalent fills and block perception merge, producing a visible “hole” or ring in fog
   * during AoE / placement picking. DM / outside-immersion: leave false so tactical bands stay readable.
   */
  immersionAllowsPerceptionOverCastRangeBands?: boolean
}

/**
 * When true, viewer perception tint may replace the tactical base fill (see {@link mergePerceptionIntoCellVisualState}).
 * @param perception When `showObstacleGlyph === false`, obstacle `blocking` cells still receive canonical visibility
 *   tints (fog/darkness) instead of the gray obstacle footprint — same concealment as occupant tokens.
 */
export function tacticalBaseFillAllowsPerceptionTint(
  baseFillKind: CellBaseFillKind,
  opts?: MergePerceptionIntoCellVisualOptions,
  perception?: EncounterGridCellRenderState,
): boolean {
  if (baseFillKind === 'paper' || baseFillKind === 'persistent-attached-aura') return true
  if (
    opts?.immersionAllowsPerceptionOverCastRangeBands &&
    (baseFillKind === 'aoe-cast-range' || baseFillKind === 'placement-cast-range')
  ) {
    return true
  }
  if (baseFillKind === 'blocked' && perception?.showObstacleGlyph === false) return true
  return false
}

/**
 * Layers **canonical** per-cell visibility presentation onto tactical cell visuals. Distinct from
 * world-space footprint overlays (`persistentAttachedAura` / AoE template), which are gated in
 * `selectGridViewModel` for immersed PC viewers before this runs.
 */
export function mergePerceptionIntoCellVisualState(
  tactical: CellVisualState,
  perception: EncounterGridCellRenderState | undefined,
  mergeOpts?: MergePerceptionIntoCellVisualOptions,
): CellVisualState {
  if (!perception?.perceptionBaseFillKind) return tactical
  if (!tacticalBaseFillAllowsPerceptionTint(tactical.baseFillKind, mergeOpts, perception)) return tactical
  return {
    ...tactical,
    baseFillKind: perception.perceptionBaseFillKind,
  }
}
