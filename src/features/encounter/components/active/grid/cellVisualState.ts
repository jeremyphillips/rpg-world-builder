import type { EncounterGridCellRenderState } from '@/features/mechanics/domain/perception/perception.render.projection'

import type { GridCellViewModel } from '../../../space/selectors/space.selectors'

/**
 * Resolved base fill / overlay intent (top-down precedence). Used by {@link getCellVisualSx}.
 * `aoe-cast-range` is first-class: cast-range band when no higher-priority tint applies (style map may use paper-equivalent fill).
 *
 * `visibility-*` kinds are **presentation-only** tints from viewer perception projection — not tactical rules.
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
  | 'visibility-dim'
  | 'visibility-darkness'
  | 'visibility-magical-darkness'
  | 'visibility-hidden'

/**
 * Movement emphasis on top of base fill. Mutually exclusive branches match legacy EncounterGrid behavior.
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
  if (cell.kind === 'wall' || cell.kind === 'blocking') return 'blocked'
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

  let movementVisual: CellMovementVisual = 'none'
  if (movementRejectedHover) {
    movementVisual = 'rejected-hover'
  } else if (showReachableMovementBorder) {
    if (suppressMovementFill) {
      movementVisual =
        isHoverCell && cell.isReachable ? 'reachable-border-only-hover' : 'reachable-border-only'
    } else if (isHoverCell && cell.isReachable) {
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

/** When true, viewer perception tint may replace the tactical base fill (see {@link mergePerceptionIntoCellVisualState}). */
export function tacticalBaseFillAllowsPerceptionTint(baseFillKind: CellBaseFillKind): boolean {
  return baseFillKind === 'paper' || baseFillKind === 'persistent-attached-aura'
}

/**
 * Layers perception presentation onto tactical cell visuals. World/encounter state is unchanged — display only.
 */
export function mergePerceptionIntoCellVisualState(
  tactical: CellVisualState,
  perception: EncounterGridCellRenderState | undefined,
): CellVisualState {
  if (!perception?.perceptionBaseFillKind) return tactical
  if (!tacticalBaseFillAllowsPerceptionTint(tactical.baseFillKind)) return tactical
  return {
    ...tactical,
    baseFillKind: perception.perceptionBaseFillKind,
  }
}
