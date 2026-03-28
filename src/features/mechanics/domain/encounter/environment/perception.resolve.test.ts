import { describe, expect, it } from 'vitest'

import {
  effectiveMagicalDarknessBypass,
  resolveViewerBattlefieldPerception,
  resolveViewerPerceptionForCell,
} from './perception.resolve'
import type { EncounterWorldCellEnvironment } from './environment.types'

function world(partial: Partial<EncounterWorldCellEnvironment>): EncounterWorldCellEnvironment {
  return {
    setting: 'outdoors',
    lightingLevel: 'bright',
    terrainMovement: 'normal',
    visibilityObscured: 'none',
    atmosphereTags: [],
    magicalDarkness: false,
    blocksDarkvision: false,
    magical: false,
    terrainCover: 'none',
    appliedZoneIds: [],
    ...partial,
  }
}

describe('resolveViewerPerceptionForCell', () => {
  it('viewer outside MD looking at normal cell', () => {
    const w = world({})
    const p = resolveViewerPerceptionForCell({
      viewerWorld: w,
      targetWorld: w,
      viewerCellId: 'a',
      targetCellId: 'b',
      viewerRole: 'pc',
    })
    expect(p.canPerceiveCell).toBe(true)
    expect(p.canPerceiveOccupants).toBe(true)
    expect(p.maskedByMagicalDarkness).toBe(false)
  })

  it('viewer outside MD looking into magical darkness', () => {
    const normal = world({})
    const dark = world({ magicalDarkness: true, lightingLevel: 'darkness', appliedZoneIds: ['z1'] })
    const p = resolveViewerPerceptionForCell({
      viewerWorld: normal,
      targetWorld: dark,
      viewerCellId: 'a',
      targetCellId: 'b',
      viewerRole: 'pc',
    })
    expect(p.canPerceiveCell).toBe(true)
    expect(p.canPerceiveOccupants).toBe(false)
    expect(p.canPerceiveObjects).toBe(false)
    expect(p.maskedByMagicalDarkness).toBe(true)
  })

  it('viewer inside magical darkness — other cells blind', () => {
    const md = world({ magicalDarkness: true })
    const outside = world({})
    const p = resolveViewerPerceptionForCell({
      viewerWorld: md,
      targetWorld: outside,
      viewerCellId: 'in',
      targetCellId: 'out',
      viewerRole: 'pc',
    })
    expect(p.canPerceiveCell).toBe(false)
    expect(p.canPerceiveOccupants).toBe(false)
    expect(p.suppressTemplateBoundary).toBe(true)
  })

  it('viewer inside magical darkness — own cell partially perceivable', () => {
    const md = world({ magicalDarkness: true })
    const p = resolveViewerPerceptionForCell({
      viewerWorld: md,
      targetWorld: md,
      viewerCellId: 'in',
      targetCellId: 'in',
      viewerRole: 'pc',
    })
    expect(p.canPerceiveCell).toBe(true)
    expect(p.canPerceiveOccupants).toBe(true)
    expect(p.canPerceiveObjects).toBe(false)
    expect(p.suppressTemplateBoundary).toBe(true)
  })

  it('DM unrestricted', () => {
    const md = world({ magicalDarkness: true })
    const p = resolveViewerPerceptionForCell({
      viewerWorld: md,
      targetWorld: md,
      viewerCellId: 'a',
      targetCellId: 'b',
      viewerRole: 'dm',
    })
    expect(p.canPerceiveOccupants).toBe(true)
    expect(p.maskedByMagicalDarkness).toBe(false)
  })

  it('heavy obscurement without MD masks occupants', () => {
    const heavy = world({ visibilityObscured: 'heavy', magicalDarkness: false })
    const p = resolveViewerPerceptionForCell({
      viewerWorld: world({}),
      targetWorld: heavy,
      viewerCellId: 'a',
      targetCellId: 'b',
      viewerRole: 'pc',
    })
    expect(p.maskedByDarkness).toBe(true)
    expect(p.canPerceiveOccupants).toBe(false)
    expect(p.maskedByMagicalDarkness).toBe(false)
  })

  it('magical darkness takes precedence over heavy obscuration on same cell', () => {
    const both = world({
      magicalDarkness: true,
      visibilityObscured: 'heavy',
    })
    const p = resolveViewerPerceptionForCell({
      viewerWorld: world({}),
      targetWorld: both,
      viewerCellId: 'a',
      targetCellId: 'b',
      viewerRole: 'pc',
    })
    expect(p.maskedByMagicalDarkness).toBe(true)
    expect(p.maskedByDarkness).toBe(false)
  })

  it('Devil’s Sight bypasses MD into target', () => {
    const dark = world({ magicalDarkness: true })
    const p = resolveViewerPerceptionForCell({
      viewerWorld: world({}),
      targetWorld: dark,
      viewerCellId: 'a',
      targetCellId: 'b',
      capabilities: { devilsSightActive: true },
      viewerRole: 'pc',
    })
    expect(p.canPerceiveOccupants).toBe(true)
    expect(p.maskedByMagicalDarkness).toBe(false)
  })

  it('default capabilities: no bypass', () => {
    expect(effectiveMagicalDarknessBypass(undefined)).toBe(false)
    expect(effectiveMagicalDarknessBypass({ darkvisionRangeFt: 60 })).toBe(false)
  })
})

describe('resolveViewerBattlefieldPerception', () => {
  it('inside MD enables veil and boundary suppression', () => {
    const md = world({ magicalDarkness: true })
    const b = resolveViewerBattlefieldPerception({
      viewerWorld: md,
      viewerCellId: 'x',
      viewerRole: 'pc',
    })
    expect(b.viewerInsideMagicalDarkness).toBe(true)
    expect(b.useBattlefieldBlindVeil).toBe(true)
    expect(b.suppressDarknessBoundaryFromInside).toBe(true)
  })

  it('DM disables veil flags', () => {
    const md = world({ magicalDarkness: true })
    const b = resolveViewerBattlefieldPerception({
      viewerWorld: md,
      viewerCellId: 'x',
      viewerRole: 'dm',
    })
    expect(b.useBattlefieldBlindVeil).toBe(false)
  })
})
