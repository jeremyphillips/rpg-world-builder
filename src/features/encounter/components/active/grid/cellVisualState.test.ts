import { describe, expect, it } from 'vitest'
import type { GridCellViewModel } from '../../../space/selectors/space.selectors'
import {
  getCellVisualState,
  movementFillSuppressedByOverlay,
  resolveBaseFillKind,
} from './cellVisualState'

/** Minimal open cell — extend only fields tests need */
function baseCell(overrides: Partial<GridCellViewModel> = {}): GridCellViewModel {
  return {
    cellId: 'c-0-0',
    x: 0,
    y: 0,
    kind: 'open',
    occupantId: null,
    occupantLabel: null,
    occupantSide: null,
    occupantPortraitImageKey: null,
    obstacleKind: null,
    obstacleLabel: null,
    isActive: false,
    isSelectedTarget: false,
    isWithinSelectedActionRange: false,
    isLegalTargetForSelectedAction: false,
    isHostileSelectedTargetPulse: false,
    isHostileLegalTargetForSelectedAction: false,
    isReachable: false,
    occupantIsDefeated: false,
    occupantRendersToken: false,
    ...overrides,
  }
}

const movementCtx = {
  hoveredCellId: null as string | null,
  movementHighlightActive: true,
  hasMovementRemaining: true,
}

describe('resolveBaseFillKind', () => {
  it('prefers wall over other flags', () => {
    expect(
      resolveBaseFillKind(
        baseCell({
          kind: 'wall',
          placementSelected: true,
          aoeInTemplate: true,
        }),
      ),
    ).toBe('blocked')
  })

  it('follows placement then AoE order', () => {
    expect(resolveBaseFillKind(baseCell({ placementInvalidHover: true }))).toBe(
      'placement-invalid-hover',
    )
    expect(
      resolveBaseFillKind(
        baseCell({ placementSelected: true, aoeInvalidOriginHover: true }),
      ),
    ).toBe('placement-selected')
    expect(
      resolveBaseFillKind(
        baseCell({ placementCastRange: true, aoeOriginLocked: true }),
      ),
    ).toBe('placement-cast-range')
  })

  it('orders AoE: invalid > locked > template > cast-range', () => {
    expect(resolveBaseFillKind(baseCell({ aoeInvalidOriginHover: true, aoeInTemplate: true }))).toBe(
      'aoe-invalid-origin-hover',
    )
    expect(resolveBaseFillKind(baseCell({ aoeOriginLocked: true, aoeInTemplate: true }))).toBe(
      'aoe-origin-locked',
    )
    expect(resolveBaseFillKind(baseCell({ aoeInTemplate: true, aoeCastRange: true }))).toBe('aoe-template')
    expect(resolveBaseFillKind(baseCell({ aoeCastRange: true }))).toBe('aoe-cast-range')
  })

  it('defaults to paper', () => {
    expect(resolveBaseFillKind(baseCell())).toBe('paper')
  })
})

describe('movementFillSuppressedByOverlay', () => {
  it('is true for aoeCastRange and placement band', () => {
    expect(movementFillSuppressedByOverlay(baseCell({ aoeCastRange: true }))).toBe(true)
    expect(movementFillSuppressedByOverlay(baseCell({ placementCastRange: true }))).toBe(true)
    expect(movementFillSuppressedByOverlay(baseCell({ aoeInTemplate: true }))).toBe(true)
    expect(movementFillSuppressedByOverlay(baseCell())).toBe(false)
  })
})

describe('getCellVisualState', () => {
  it('uses reachable-border-only when movement fill suppressed by aoeCastRange', () => {
    const s = getCellVisualState(
      baseCell({ isReachable: true, aoeCastRange: true }),
      movementCtx,
    )
    expect(s.baseFillKind).toBe('aoe-cast-range')
    expect(s.movementFillSuppressedByOverlay).toBe(true)
    expect(s.movementVisual).toBe('reachable-border-only')
  })

  it('uses reachable-border-only-hover when suppressed overlay and cell is hovered', () => {
    const s = getCellVisualState(
      baseCell({ cellId: 'c-1-1', isReachable: true, aoeCastRange: true }),
      { ...movementCtx, hoveredCellId: 'c-1-1' },
    )
    expect(s.movementVisual).toBe('reachable-border-only-hover')
  })

  it('uses reachable fill when reachable and overlay does not suppress', () => {
    const s = getCellVisualState(baseCell({ isReachable: true }), movementCtx)
    expect(s.movementVisual).toBe('reachable-fill-weak')
  })

  it('uses strong fill when hovered reachable cell', () => {
    const s = getCellVisualState(
      baseCell({ cellId: 'c-1-1', isReachable: true }),
      { ...movementCtx, hoveredCellId: 'c-1-1' },
    )
    expect(s.movementVisual).toBe('reachable-fill-strong')
  })

  it('rejected hover on empty unreachable cell', () => {
    const s = getCellVisualState(
      baseCell({ cellId: 'c-2-2', isReachable: false }),
      { ...movementCtx, hoveredCellId: 'c-2-2' },
    )
    expect(s.movementVisual).toBe('rejected-hover')
  })

  it('no movement on walls', () => {
    const s = getCellVisualState(
      baseCell({ kind: 'wall', isReachable: true }),
      movementCtx,
    )
    expect(s.baseFillKind).toBe('blocked')
    expect(s.movementVisual).toBe('none')
  })
})
