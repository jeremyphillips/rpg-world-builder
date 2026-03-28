import { describe, expect, it } from 'vitest'

import type { EncounterViewerBattlefieldPerception } from '../perception.types'
import type { EncounterViewerPerceptionCell } from '../perception.types'
import {
  projectBattlefieldRenderState,
  projectGridCellRenderState,
  resolvePerceptionPresentationFill,
} from '../perception.render.projection'

function baseBattlefield(overrides: Partial<EncounterViewerBattlefieldPerception> = {}): EncounterViewerBattlefieldPerception {
  return {
    viewerCellId: 'a',
    viewerInsideMagicalDarkness: false,
    viewerInsideHeavyObscurement: false,
    useBattlefieldBlindVeil: false,
    suppressDarknessBoundaryFromInside: false,
    ...overrides,
  }
}

function basePerception(overrides: Partial<EncounterViewerPerceptionCell> = {}): EncounterViewerPerceptionCell {
  return {
    canPerceiveCell: true,
    canPerceiveOccupants: true,
    canPerceiveObjects: true,
    maskedByDarkness: false,
    maskedByMagicalDarkness: false,
    suppressTemplateBoundary: false,
    worldLightingLevel: 'bright',
    worldVisibilityObscured: 'none',
    appliedZoneIds: [],
    ...overrides,
  }
}

describe('projectBattlefieldRenderState', () => {
  it('DM viewer bypasses blind veil and overlays', () => {
    const bp = baseBattlefield({
      useBattlefieldBlindVeil: true,
      suppressDarknessBoundaryFromInside: true,
    })
    const r = projectBattlefieldRenderState(bp, 'dm')
    expect(r.useBlindVeil).toBe(false)
    expect(r.suppressDarknessBoundaryFromInside).toBe(false)
    expect(r.suppressAoeTemplateOverlay).toBe(false)
    expect(r.blindVeilOpacity).toBe(0)
  })

  it('PC inside magical darkness gets blind veil when domain says so', () => {
    const bp = baseBattlefield({
      useBattlefieldBlindVeil: true,
      suppressDarknessBoundaryFromInside: true,
    })
    const r = projectBattlefieldRenderState(bp, 'pc')
    expect(r.useBlindVeil).toBe(true)
    expect(r.suppressDarknessBoundaryFromInside).toBe(true)
    expect(r.suppressAoeTemplateOverlay).toBe(true)
    expect(r.blindVeilOpacity).toBeGreaterThan(0)
  })
})

describe('projectGridCellRenderState', () => {
  const battlefieldBlind = projectBattlefieldRenderState(
    baseBattlefield({ useBattlefieldBlindVeil: true, suppressDarknessBoundaryFromInside: true }),
    'pc',
  )
  const battlefieldNormal = projectBattlefieldRenderState(baseBattlefield(), 'pc')

  it('DM always shows all tokens and obstacles', () => {
    const p = basePerception({ canPerceiveOccupants: false })
    const r = projectGridCellRenderState({
      perception: p,
      battlefield: battlefieldBlind,
      viewerRole: 'dm',
      isViewerCell: false,
    })
    expect(r.occupantTokenVisibility).toBe('all')
    expect(r.showObstacleGlyph).toBe(true)
    expect(r.perceptionBaseFillKind).toBeNull()
  })

  it('blind veil: viewer cell keeps self-only token visibility', () => {
    const p = basePerception()
    const r = projectGridCellRenderState({
      perception: p,
      battlefield: battlefieldBlind,
      viewerRole: 'pc',
      isViewerCell: true,
    })
    expect(r.occupantTokenVisibility).toBe('self-only')
    expect(r.showObstacleGlyph).toBe(true)
  })

  it('blind veil: other cells hide tokens and obstacle glyphs', () => {
    const p = basePerception()
    const r = projectGridCellRenderState({
      perception: p,
      battlefield: battlefieldBlind,
      viewerRole: 'pc',
      isViewerCell: false,
    })
    expect(r.occupantTokenVisibility).toBe('none')
    expect(r.showObstacleGlyph).toBe(false)
  })

  it('outside blind veil: darkness region shows magical-darkness tint, occupants hidden per domain', () => {
    const p = basePerception({
      canPerceiveOccupants: false,
      canPerceiveObjects: false,
      maskedByMagicalDarkness: true,
    })
    const r = projectGridCellRenderState({
      perception: p,
      battlefield: battlefieldNormal,
      viewerRole: 'pc',
      isViewerCell: false,
    })
    expect(r.perceptionBaseFillKind).toBe('visibility-magical-darkness')
    expect(r.occupantTokenVisibility).toBe('none')
  })
})

describe('resolvePerceptionPresentationFill', () => {
  it('maps obscured cell to visibility-hidden before other masks', () => {
    expect(
      resolvePerceptionPresentationFill(
        basePerception({
          canPerceiveCell: false,
          maskedByMagicalDarkness: true,
        }),
      ),
    ).toBe('visibility-hidden')
  })

  it('maps magical darkness tint when cell is perceivable', () => {
    expect(
      resolvePerceptionPresentationFill(
        basePerception({ maskedByMagicalDarkness: true }),
      ),
    ).toBe('visibility-magical-darkness')
  })

  it('maps non-magical darkness before dim', () => {
    expect(
      resolvePerceptionPresentationFill(basePerception({ maskedByDarkness: true })),
    ).toBe('visibility-darkness')
  })

  it('maps light obscurement to dim', () => {
    expect(
      resolvePerceptionPresentationFill(basePerception({ worldVisibilityObscured: 'light' })),
    ).toBe('visibility-dim')
  })
})
