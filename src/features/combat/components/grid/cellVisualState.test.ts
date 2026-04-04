import { describe, expect, it } from 'vitest'
import { resolvePlacedObjectCellVisualFromPlacedKind } from '@/features/content/locations/domain/mapPresentation/resolvePlacedObjectCellVisual'
import type { GridCellViewModel } from '@/features/mechanics/domain/combat/space/selectors/space.selectors'
import type { EncounterGridCellRenderState } from '@/features/mechanics/domain/perception/perception.render.projection'

import {
  getCellVisualState,
  mergePerceptionIntoCellVisualState,
  movementFillSuppressedByOverlay,
  resolveBaseFillKind,
  tacticalBaseFillAllowsPerceptionTint,
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
    placedObjectKind: null,
    placedObjectVisual: null,
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

  it('structural blocking without a grid object keeps tactical blocked fill', () => {
    expect(resolveBaseFillKind(baseCell({ kind: 'blocking' }))).toBe('blocked')
  })

  it('blocking cell hosting a grid object uses paper so authored floor (e.g. stone_floor) can apply', () => {
    expect(
      resolveBaseFillKind(
        baseCell({
          kind: 'blocking',
          placedObjectKind: 'tree',
          placedObjectVisual: resolvePlacedObjectCellVisualFromPlacedKind('tree'),
        }),
      ),
    ).toBe('paper')
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

const fogPerception: Pick<
  EncounterGridCellRenderState,
  'occupantTokenVisibility' | 'showObstacleGlyph' | 'perceptionBaseFillKind' | 'suppressTemplateBoundary'
> = {
  occupantTokenVisibility: 'none',
  showObstacleGlyph: false,
  perceptionBaseFillKind: 'fog',
  suppressTemplateBoundary: false,
}

describe('mergePerceptionIntoCellVisualState — immersed cast-range band leak', () => {
  it('blocks perception over aoe-cast-range by default (tactical band wins)', () => {
    expect(tacticalBaseFillAllowsPerceptionTint('aoe-cast-range')).toBe(false)
    const tactical = {
      baseFillKind: 'aoe-cast-range' as const,
      movementFillSuppressedByOverlay: true,
      movementVisual: 'reachable-border-only' as const,
    }
    const out = mergePerceptionIntoCellVisualState(tactical, fogPerception as EncounterGridCellRenderState)
    expect(out.baseFillKind).toBe('aoe-cast-range')
  })

  it('allows fog over aoe-cast-range when immersion merge flag is set (immersed PC in obscuration)', () => {
    expect(
      tacticalBaseFillAllowsPerceptionTint('aoe-cast-range', {
        immersionAllowsPerceptionOverCastRangeBands: true,
      }),
    ).toBe(true)
    const tactical = {
      baseFillKind: 'aoe-cast-range' as const,
      movementFillSuppressedByOverlay: true,
      movementVisual: 'reachable-border-only' as const,
    }
    const out = mergePerceptionIntoCellVisualState(tactical, fogPerception as EncounterGridCellRenderState, {
      immersionAllowsPerceptionOverCastRangeBands: true,
    })
    expect(out.baseFillKind).toBe('fog')
  })

  it('allows visibility fill over placement-cast-range when immersion flag is set', () => {
    expect(
      tacticalBaseFillAllowsPerceptionTint('placement-cast-range', {
        immersionAllowsPerceptionOverCastRangeBands: true,
      }),
    ).toBe(true)
    const tactical = {
      baseFillKind: 'placement-cast-range' as const,
      movementFillSuppressedByOverlay: true,
      movementVisual: 'none' as const,
    }
    const out = mergePerceptionIntoCellVisualState(tactical, fogPerception as EncounterGridCellRenderState, {
      immersionAllowsPerceptionOverCastRangeBands: true,
    })
    expect(out.baseFillKind).toBe('fog')
  })

  it('does not use immersion merge for aoe-template (still blocked; selector clears template when immersed)', () => {
    expect(
      tacticalBaseFillAllowsPerceptionTint('aoe-template', {
        immersionAllowsPerceptionOverCastRangeBands: true,
      }),
    ).toBe(false)
  })
})

describe('mergePerceptionIntoCellVisualState — concealed obstacle blocking cell', () => {
  it('does not replace blocked tactical fill when obstacle is perceivable (glyph shown)', () => {
    expect(tacticalBaseFillAllowsPerceptionTint('blocked')).toBe(false)
    expect(
      tacticalBaseFillAllowsPerceptionTint('blocked', undefined, {
        ...fogPerception,
        showObstacleGlyph: true,
        perceptionBaseFillKind: 'fog',
      } as EncounterGridCellRenderState),
    ).toBe(false)
    const tactical = {
      baseFillKind: 'blocked' as const,
      movementFillSuppressedByOverlay: false,
      movementVisual: 'none' as const,
    }
    const out = mergePerceptionIntoCellVisualState(tactical, {
      ...fogPerception,
      showObstacleGlyph: true,
    } as EncounterGridCellRenderState)
    expect(out.baseFillKind).toBe('blocked')
  })

  it('replaces blocked fill with perception tint when obstacle glyph is hidden (same signal as no object affordance)', () => {
    expect(
      tacticalBaseFillAllowsPerceptionTint('blocked', undefined, fogPerception as EncounterGridCellRenderState),
    ).toBe(true)
    const tactical = {
      baseFillKind: 'blocked' as const,
      movementFillSuppressedByOverlay: false,
      movementVisual: 'none' as const,
    }
    const out = mergePerceptionIntoCellVisualState(tactical, fogPerception as EncounterGridCellRenderState)
    expect(out.baseFillKind).toBe('fog')
  })

  it('blocked cell without perception merge opts in leaves gray obstacle footprint (legacy no slice)', () => {
    const tactical = {
      baseFillKind: 'blocked' as const,
      movementFillSuppressedByOverlay: false,
      movementVisual: 'none' as const,
    }
    const out = mergePerceptionIntoCellVisualState(tactical, undefined)
    expect(out.baseFillKind).toBe('blocked')
  })
})
