import { describe, expect, it } from 'vitest'

import { createSquareGridSpace } from '@/features/encounter/space/createSquareGridSpace'
import {
  canPerceiveTargetOccupantForCombat,
  canVisuallyPerceiveSubjectForRules,
  cellWorldSupportsHideConcealment,
  createEncounterState,
  getHideAttemptEligibilityDenialReason,
  getSightBasedCheckLegalityDenialReason,
  getStealthHideAttemptDenialReason,
  resolveTerrainCoverGradeForHideFromObserver,
} from '@/features/mechanics/domain/encounter/state'

import { encounterAttackerOutsideDefenderHeavilyObscured, testEnemy, testPc } from './encounter-visibility-test-fixtures'

describe('sight-based checks (shared seam)', () => {
  it('matches canPerceiveTargetOccupantForCombat', () => {
    const heavy = encounterAttackerOutsideDefenderHeavilyObscured()
    expect(canVisuallyPerceiveSubjectForRules(heavy, 'wiz', 'orc')).toBe(
      canPerceiveTargetOccupantForCombat(heavy, 'wiz', 'orc'),
    )
  })

  it('allows sight-based check when subject occupant is perceivable', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('w', 'Wizard', 20)
    const o = testEnemy('o', 'Orc', 20)
    const state = createEncounterState([w, o], { rng: () => 0.5, space })
    const withPlacements = {
      ...state,
      placements: [
        { combatantId: 'w', cellId: 'c-0-0' },
        { combatantId: 'o', cellId: 'c-1-0' },
      ],
    }
    expect(getSightBasedCheckLegalityDenialReason(withPlacements, 'w', 'o')).toBe(null)
  })

  it('blocks sight-based check when cell/region may be known but occupant not perceivable', () => {
    const heavy = encounterAttackerOutsideDefenderHeavilyObscured()
    expect(getSightBasedCheckLegalityDenialReason(heavy, 'wiz', 'orc')).toBe('cannot-perceive-subject')
  })

  it('permissive when no grid (same fallback as pair visibility)', () => {
    const w = testPc('w', 'Wizard', 20)
    const o = testEnemy('o', 'Orc', 20)
    const noGrid = createEncounterState([w, o], { rng: () => 0.5 })
    expect(getSightBasedCheckLegalityDenialReason(noGrid, 'w', 'o')).toBe(null)
  })
})

describe('hide attempt eligibility', () => {
  it('denies hide in bright open when observer perceives occupant', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
    }
    expect(getHideAttemptEligibilityDenialReason(state, 'orc', 'wiz')).toBe('observer-sees-without-concealment')
  })

  it('allows hide when heavy obscurement blocks occupant perception (shared seam)', () => {
    const heavy = encounterAttackerOutsideDefenderHeavilyObscured()
    expect(getHideAttemptEligibilityDenialReason(heavy, 'orc', 'wiz')).toBe(null)
  })

  it('denies hide in dim-only lighting when observer perceives occupant (no universal dim basis)', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-dim',
          kind: 'patch',
          sourceKind: 'manual',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { lightingLevel: 'dim' },
        },
      ],
    }
    expect(getHideAttemptEligibilityDenialReason(state, 'orc', 'wiz')).toBe('observer-sees-without-concealment')
  })

  it('allowDimLightHide permits dim-only cell when observer still perceives occupant', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-dim',
          kind: 'patch',
          sourceKind: 'manual',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { lightingLevel: 'dim' },
        },
      ],
    }
    expect(
      getHideAttemptEligibilityDenialReason(state, 'orc', 'wiz', {
        hideEligibility: { featureFlags: { allowDimLightHide: true } },
      }),
    ).toBe(null)
  })

  it('denies hide in magical light obscurement when observer perceives occupant (no universal magical basis)', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-mag-lo',
          kind: 'patch',
          sourceKind: 'spell',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { visibilityObscured: 'light' },
          magical: { magical: true },
        },
      ],
    }
    expect(canPerceiveTargetOccupantForCombat(state, 'wiz', 'orc')).toBe(true)
    expect(getHideAttemptEligibilityDenialReason(state, 'orc', 'wiz')).toBe('observer-sees-without-concealment')
  })

  it('allowMagicalConcealmentHide permits magically tagged light obscurement', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-mag-lo',
          kind: 'patch',
          sourceKind: 'spell',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { visibilityObscured: 'light' },
          magical: { magical: true },
        },
      ],
    }
    expect(
      getHideAttemptEligibilityDenialReason(state, 'orc', 'wiz', {
        hideEligibility: { featureFlags: { allowMagicalConcealmentHide: true } },
      }),
    ).toBe(null)
  })

  it('allows hide when cell has light obscurement even if occupant is still perceivable (concealment gate)', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-lo',
          kind: 'patch',
          sourceKind: 'manual',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { visibilityObscured: 'light' },
        },
      ],
    }
    expect(canPerceiveTargetOccupantForCombat(state, 'wiz', 'orc')).toBe(true)
    expect(getHideAttemptEligibilityDenialReason(state, 'orc', 'wiz')).toBe(null)
  })

  it('permissive hide attempt when no tactical grid (fallback)', () => {
    const w = testPc('w', 'Wizard', 20)
    const o = testEnemy('o', 'Orc', 20)
    const noGrid = createEncounterState([w, o], { rng: () => 0.5 })
    expect(getHideAttemptEligibilityDenialReason(noGrid, 'o', 'w')).toBe(null)
  })

  it('cellWorldSupportsHideConcealment: dim-only is not baseline concealment', () => {
    expect(
      cellWorldSupportsHideConcealment({
        setting: 'outdoors',
        lightingLevel: 'dim',
        terrainMovement: 'normal',
        visibilityObscured: 'none',
        atmosphereTags: [],
        magicalDarkness: false,
        blocksDarkvision: false,
        magical: false,
        terrainCover: 'none',
        appliedZoneIds: [],
      }),
    ).toBe(false)
  })

  it('cellWorldSupportsHideConcealment reflects heavy obscurement and darkness', () => {
    expect(
      cellWorldSupportsHideConcealment({
        setting: 'outdoors',
        lightingLevel: 'bright',
        terrainMovement: 'normal',
        visibilityObscured: 'heavy',
        atmosphereTags: [],
        magicalDarkness: false,
        blocksDarkvision: false,
        magical: false,
        terrainCover: 'none',
        appliedZoneIds: [],
      }),
    ).toBe(true)
    expect(
      cellWorldSupportsHideConcealment({
        setting: 'outdoors',
        lightingLevel: 'darkness',
        terrainMovement: 'normal',
        visibilityObscured: 'none',
        atmosphereTags: [],
        magicalDarkness: false,
        blocksDarkvision: false,
        magical: false,
        terrainCover: 'none',
        appliedZoneIds: [],
      }),
    ).toBe(true)
    expect(
      cellWorldSupportsHideConcealment({
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
      }),
    ).toBe(false)
  })

  it('allows hide with three-quarters cover when observer sees occupant in bright open (baseline)', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-cover',
          kind: 'patch',
          sourceKind: 'terrain-feature',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { terrainCover: 'three-quarters' },
        },
      ],
    }
    expect(getHideAttemptEligibilityDenialReason(state, 'orc', 'wiz')).toBe(null)
  })

  it('allows hide with full (total) cover when observer sees occupant', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-full',
          kind: 'patch',
          sourceKind: 'terrain-feature',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { terrainCover: 'full' },
        },
      ],
    }
    expect(getHideAttemptEligibilityDenialReason(state, 'orc', 'wiz')).toBe(null)
  })

  it('denies hide with half cover only when observer sees occupant (baseline)', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-half',
          kind: 'patch',
          sourceKind: 'terrain-feature',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { terrainCover: 'half' },
        },
      ],
    }
    expect(getHideAttemptEligibilityDenialReason(state, 'orc', 'wiz')).toBe('observer-sees-without-concealment')
  })

  it('extension seam: allowHalfCoverForHide permits half cover when set', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-half',
          kind: 'patch',
          sourceKind: 'terrain-feature',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { terrainCover: 'half' },
        },
      ],
    }
    expect(
      getHideAttemptEligibilityDenialReason(state, 'orc', 'wiz', {
        hideEligibility: { featureFlags: { allowHalfCoverForHide: true } },
      }),
    ).toBe(null)
    expect(getStealthHideAttemptDenialReason(state, 'orc', 'wiz')).toBe('observer-sees-without-concealment')
  })

  it('combatant skillRuntime.hideEligibilityFeatureFlags allows dim-only hide without call-site options', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const orcWithDim = {
      ...o,
      stats: {
        ...o.stats,
        skillRuntime: { hideEligibilityFeatureFlags: { allowDimLightHide: true } },
      },
    }
    const base = createEncounterState([w, orcWithDim], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-dim',
          kind: 'patch',
          sourceKind: 'manual',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { lightingLevel: 'dim' },
        },
      ],
    }
    expect(getHideAttemptEligibilityDenialReason(state, 'orc', 'wiz')).toBe(null)
    expect(getStealthHideAttemptDenialReason(state, 'orc', 'wiz')).toBe(null)
  })

  it('combatant skillRuntime.hideEligibilityFeatureFlags allows half cover without call-site options', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const orcWithFeat = {
      ...o,
      stats: {
        ...o.stats,
        skillRuntime: { hideEligibilityFeatureFlags: { allowHalfCoverForHide: true } },
      },
    }
    const base = createEncounterState([w, orcWithFeat], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-half',
          kind: 'patch',
          sourceKind: 'terrain-feature',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { terrainCover: 'half' },
        },
      ],
    }
    expect(getHideAttemptEligibilityDenialReason(state, 'orc', 'wiz')).toBe(null)
    expect(getStealthHideAttemptDenialReason(state, 'orc', 'wiz')).toBe(null)
  })

  it('observer-relative: intermediate cell cover supports hide from one observer angle but not another', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const wiz = testPc('wiz', 'Wizard', 20)
    const bard = testPc('bard', 'Bard', 20)
    const orc = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([wiz, bard, orc], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-2-0' },
        { combatantId: 'bard', cellId: 'c-4-0' },
      ],
      environmentZones: [
        {
          id: 'z-tq',
          kind: 'patch',
          sourceKind: 'terrain-feature',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { terrainCover: 'three-quarters' },
        },
      ],
    }
    expect(canPerceiveTargetOccupantForCombat(state, 'wiz', 'orc')).toBe(true)
    expect(canPerceiveTargetOccupantForCombat(state, 'bard', 'orc')).toBe(true)
    expect(getHideAttemptEligibilityDenialReason(state, 'orc', 'wiz')).toBe(null)
    expect(getHideAttemptEligibilityDenialReason(state, 'orc', 'bard')).toBe('observer-sees-without-concealment')
  })

  it('resolveTerrainCoverGradeForHideFromObserver maxes merged terrainCover along supercover segment', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const wiz = testPc('wiz', 'Wizard', 20)
    const bard = testPc('bard', 'Bard', 20)
    const orc = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([wiz, bard, orc], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-2-0' },
        { combatantId: 'bard', cellId: 'c-4-0' },
      ],
      environmentZones: [
        {
          id: 'z-tq',
          kind: 'patch',
          sourceKind: 'terrain-feature',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { terrainCover: 'three-quarters' },
        },
      ],
    }
    expect(resolveTerrainCoverGradeForHideFromObserver(state, 'wiz', 'orc')).toBe('three-quarters')
    expect(resolveTerrainCoverGradeForHideFromObserver(state, 'bard', 'orc')).toBe('none')
  })

  it('denies hide on difficult terrain alone without allowDifficultTerrainHide', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-diff',
          kind: 'patch',
          sourceKind: 'terrain-feature',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { terrainMovement: 'difficult' },
        },
      ],
    }
    expect(getHideAttemptEligibilityDenialReason(state, 'orc', 'wiz')).toBe('observer-sees-without-concealment')
    expect(
      getHideAttemptEligibilityDenialReason(state, 'orc', 'wiz', {
        hideEligibility: { featureFlags: { allowDifficultTerrainHide: true } },
      }),
    ).toBe(null)
  })

  it('denies hide in high wind alone without allowHighWindHide', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-wind',
          kind: 'patch',
          sourceKind: 'manual',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { atmosphereTagsAdd: ['high-wind'] },
        },
      ],
    }
    expect(getHideAttemptEligibilityDenialReason(state, 'orc', 'wiz')).toBe('observer-sees-without-concealment')
    expect(
      getHideAttemptEligibilityDenialReason(state, 'orc', 'wiz', {
        hideEligibility: { featureFlags: { allowHighWindHide: true } },
      }),
    ).toBe(null)
  })
})
