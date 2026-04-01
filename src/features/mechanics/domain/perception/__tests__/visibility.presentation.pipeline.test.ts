import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

import type { EncounterWorldCellEnvironment } from '../../environment/environment.types'
import { inferObscurationPresentationCausesWhenMissing } from '../visibility.presentation.compatibility'
import { resolveViewerPerceptionForCell } from '../perception.resolve'
import {
  buildViewerAdjustedPresentationWorld,
  mapResolvedVisibilityToFillKind,
  resolvePresentationVisibilityFill,
  resolvePresentationVisibilityFillFromMergedWorld,
} from '../visibility.presentation'
import {
  projectGridCellRenderState,
  projectBattlefieldRenderState,
} from '../perception.render.projection'
import type { EncounterViewerBattlefieldPerception, EncounterViewerPerceptionCell } from '../perception.types'

const __dirname = dirname(fileURLToPath(import.meta.url))

function basePerception(overrides: Partial<EncounterViewerPerceptionCell> = {}): EncounterViewerPerceptionCell {
  return {
    canPerceiveCell: true,
    canPerceiveOccupants: true,
    canPerceiveObjects: true,
    maskedByDarkness: false,
    environmentalDarknessMitigatedByDarkvision: false,
    perceivedByBlindsight: false,
    maskedByMagicalDarkness: false,
    suppressTemplateBoundary: false,
    worldLightingLevel: 'bright',
    worldVisibilityObscured: 'none',
    appliedZoneIds: [],
    ...overrides,
  }
}

function baseWorld(overrides: Partial<EncounterWorldCellEnvironment> = {}): EncounterWorldCellEnvironment {
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
    obscurationPresentationCauses: [],
    ...overrides,
  }
}

describe('canonical visibility presentation pipeline', () => {
  it('exposes a single semantic → fill mapping helper', () => {
    expect(typeof mapResolvedVisibilityToFillKind).toBe('function')
  })

  it('fog-profile obscuration resolves through the same path as any other fog cause (e.g. Stinking Cloud vs Fog Cloud)', () => {
    const p = basePerception({
      canPerceiveOccupants: false,
      canPerceiveObjects: false,
      maskedByDarkness: true,
      worldVisibilityObscured: 'heavy',
      worldLightingLevel: 'bright',
    })
    const fogCloudWorld = baseWorld({
      obscurationPresentationCauses: ['fog'],
      visibilityObscured: 'heavy',
      lightingLevel: 'bright',
    })
    const stinkingCloudWorld = baseWorld({
      obscurationPresentationCauses: ['fog'],
      visibilityObscured: 'heavy',
      lightingLevel: 'bright',
    })
    expect(resolvePresentationVisibilityFillFromMergedWorld(p, fogCloudWorld)).toBe('fog')
    expect(resolvePresentationVisibilityFillFromMergedWorld(p, stinkingCloudWorld)).toBe('fog')
  })

  it('when causes are already merged, compatibility inference is a no-op (same object reference)', () => {
    const world = baseWorld({ obscurationPresentationCauses: ['fog'], visibilityObscured: 'heavy' })
    const p = basePerception({ maskedByDarkness: true, worldVisibilityObscured: 'heavy' })
    expect(inferObscurationPresentationCausesWhenMissing(world, p)).toBe(world)
  })

  it('full entry matches merged-world helper after applying compatibility inference', () => {
    const p = basePerception({ maskedByDarkness: true, worldVisibilityObscured: 'heavy' })
    const targetWorld = baseWorld({ visibilityObscured: 'heavy', obscurationPresentationCauses: [] })
    const withCauses = inferObscurationPresentationCausesWhenMissing(targetWorld, p)
    expect(resolvePresentationVisibilityFill(p, targetWorld)).toBe(
      resolvePresentationVisibilityFillFromMergedWorld(p, withCauses),
    )
  })

  it('legacy hand-built world without causes still gets darkness fill via inference (not bypassing resolver)', () => {
    const p = basePerception({ maskedByDarkness: true })
    const legacyWorld = baseWorld({
      lightingLevel: 'dim',
      visibilityObscured: 'none',
      obscurationPresentationCauses: [],
    })
    expect(resolvePresentationVisibilityFill(p, legacyWorld)).toBe('darkness')
  })

  it('fog with cause metadata does not collapse to darkness fill when heavy obscured', () => {
    const p = basePerception({
      maskedByDarkness: true,
      worldVisibilityObscured: 'heavy',
      worldLightingLevel: 'bright',
    })
    const w = baseWorld({
      obscurationPresentationCauses: ['fog'],
      visibilityObscured: 'heavy',
      lightingLevel: 'bright',
    })
    expect(resolvePresentationVisibilityFillFromMergedWorld(p, w)).toBe('fog')
  })

  it('darkvision-mitigated ordinary darkness does not resolve to darkness presentation fill', () => {
    const darkWorld = baseWorld({
      lightingLevel: 'darkness',
      obscurationPresentationCauses: ['darkness'],
      visibilityObscured: 'none',
    })
    const p = resolveViewerPerceptionForCell({
      viewerWorld: baseWorld({}),
      targetWorld: darkWorld,
      viewerCellId: 'a',
      targetCellId: 'b',
      viewerRole: 'pc',
      capabilities: { darkvisionRangeFt: 60 },
    })
    expect(p.environmentalDarknessMitigatedByDarkvision).toBe(true)
    expect(resolvePresentationVisibilityFillFromMergedWorld(p, darkWorld)).not.toBe('darkness')
  })

  it('blindsight within range — presentation does not keep fog / darkness tints on target cell', () => {
    const fogWorld = baseWorld({
      lightingLevel: 'bright',
      visibilityObscured: 'heavy',
      obscurationPresentationCauses: ['fog'],
    })
    const p = resolveViewerPerceptionForCell({
      viewerWorld: baseWorld({}),
      targetWorld: fogWorld,
      viewerCellId: 'a',
      targetCellId: 'b',
      viewerRole: 'pc',
      capabilities: { blindsightRangeFt: 60 },
      distanceViewerToTargetFt: 10,
    })
    expect(p.perceivedByBlindsight).toBe(true)
    const fill = resolvePresentationVisibilityFillFromMergedWorld(p, fogWorld)
    expect(fill).not.toBe('fog')
    expect(fill).not.toBe('darkness')
    expect(fill).not.toBe('magical-darkness')
  })

  it('buildViewerAdjustedPresentationWorld is a shallow copy and strips darkness causes when mitigated', () => {
    const w = baseWorld({
      lightingLevel: 'darkness',
      obscurationPresentationCauses: ['darkness', 'fog'],
    })
    const p = basePerception({ environmentalDarknessMitigatedByDarkvision: true })
    const adj = buildViewerAdjustedPresentationWorld(w, p)
    expect(adj).not.toBe(w)
    expect(adj.lightingLevel).toBe('dim')
    expect(adj.obscurationPresentationCauses).toEqual(['fog'])
  })

  it('magical darkness still wins precedence over fog cause in merged world', () => {
    const p = basePerception({
      maskedByMagicalDarkness: true,
      worldVisibilityObscured: 'heavy',
    })
    const w = baseWorld({
      obscurationPresentationCauses: ['fog', 'magical-darkness'],
      magicalDarkness: true,
      visibilityObscured: 'heavy',
    })
    expect(resolvePresentationVisibilityFillFromMergedWorld(p, w)).toBe('magical-darkness')
  })

  it('immersed fog vs magical darkness: unrevealed outside cells inherit viewer obscuration tint (not generic hidden)', () => {
    const fogViewer = baseWorld({
      visibilityObscured: 'heavy',
      magicalDarkness: false,
      obscurationPresentationCauses: ['fog'],
    })
    const mdViewer = baseWorld({
      magicalDarkness: true,
      lightingLevel: 'darkness',
      visibilityObscured: 'heavy',
      obscurationPresentationCauses: ['magical-darkness'],
    })
    const outside = baseWorld({ visibilityObscured: 'none', lightingLevel: 'bright' })
    const pFog = resolveViewerPerceptionForCell({
      viewerWorld: fogViewer,
      targetWorld: outside,
      viewerCellId: 'in',
      targetCellId: 'out',
      viewerRole: 'pc',
    })
    const pMd = resolveViewerPerceptionForCell({
      viewerWorld: mdViewer,
      targetWorld: outside,
      viewerCellId: 'in',
      targetCellId: 'out',
      viewerRole: 'pc',
    })
    expect(pFog.canPerceiveCell).toBe(false)
    expect(pMd.canPerceiveCell).toBe(false)
    expect(resolvePresentationVisibilityFill(pFog, outside, fogViewer)).toBe('fog')
    expect(resolvePresentationVisibilityFill(pMd, outside, mdViewer)).toBe('magical-darkness')
  })
})

describe('renderer uses canonical presentation helper only', () => {
  function bf(): EncounterViewerBattlefieldPerception {
    return {
      viewerCellId: 'a',
      viewerInsideMagicalDarkness: false,
      viewerInsideHeavyObscurement: false,
      useBattlefieldBlindVeil: false,
      suppressDarknessBoundaryFromInside: false,
    }
  }

  it('projectGridCellRenderState perceptionBaseFillKind matches resolvePresentationVisibilityFill', () => {
    const p = basePerception({ maskedByMagicalDarkness: true })
    const tw = baseWorld({
      lightingLevel: 'bright',
      visibilityObscured: 'none',
      magicalDarkness: true,
      magical: true,
      obscurationPresentationCauses: [],
    })
    const battlefield = projectBattlefieldRenderState(bf(), 'pc')
    const direct = resolvePresentationVisibilityFill(p, tw)
    const projected = projectGridCellRenderState({
      perception: p,
      targetWorld: tw,
      viewerWorld: tw,
      battlefield,
      viewerRole: 'pc',
      isViewerCell: false,
    }).perceptionBaseFillKind
    expect(projected).toBe(direct)
  })
})

describe('presentation module stays free of spell-specific branching', () => {
  it('visibility.presentation.ts does not reference spell ids or ruleset data', () => {
    const src = readFileSync(join(__dirname, '../visibility.presentation.ts'), 'utf8')
    expect(src).not.toMatch(/Fog Cloud|Stinking Cloud|level1-a-l|spellId/i)
  })
})
