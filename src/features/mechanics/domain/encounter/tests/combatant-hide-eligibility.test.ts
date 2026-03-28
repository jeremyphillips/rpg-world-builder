import { describe, expect, it } from 'vitest'

import {
  getCombatantHideEligibilityExtensionOptions,
  mergeHideEligibilityFeatureFlagsOr,
  resolveTemporaryHideEligibilityFeatureFlagsFromCombatantRuntime,
  RUNTIME_MARKER_HIDE_ELIGIBILITY_ALLOW_HALF_COVER_ID,
} from '@/features/mechanics/domain/encounter/state'

import { testEnemy } from './encounter-visibility-test-fixtures'

const hideGrantHalfCover = {
  kind: 'hide-eligibility-grant' as const,
  featureFlags: { allowHalfCoverForHide: true },
}

describe('getCombatantHideEligibilityExtensionOptions', () => {
  it('returns undefined when no hide eligibility flags are set', () => {
    const c = testEnemy('o', 'Orc', 20)
    expect(getCombatantHideEligibilityExtensionOptions(c)).toBeUndefined()
  })

  it('returns extension options from skillRuntime.hideEligibilityFeatureFlags', () => {
    const c = testEnemy('o', 'Orc', 20)
    const withFlags = {
      ...c,
      stats: {
        ...c.stats,
        skillRuntime: { hideEligibilityFeatureFlags: { allowHalfCoverForHide: true } },
      },
    }
    expect(getCombatantHideEligibilityExtensionOptions(withFlags)).toEqual({
      featureFlags: { allowHalfCoverForHide: true },
    })
  })

  it('includes hide-eligibility-grant from activeEffects (nested in aura)', () => {
    const c = testEnemy('o', 'Orc', 20)
    const withAura = {
      ...c,
      activeEffects: [
        {
          kind: 'aura' as const,
          range: 5,
          affects: 'self' as const,
          effects: [hideGrantHalfCover],
        },
      ],
    }
    expect(getCombatantHideEligibilityExtensionOptions(withAura)).toEqual({
      featureFlags: { allowHalfCoverForHide: true },
    })
  })

  it('includes allow-half-cover from runtime marker id on conditions', () => {
    const c = testEnemy('o', 'Orc', 20)
    const withMarker = {
      ...c,
      conditions: [
        {
          id: RUNTIME_MARKER_HIDE_ELIGIBILITY_ALLOW_HALF_COVER_ID,
          label: 'Test',
        },
      ],
    }
    expect(getCombatantHideEligibilityExtensionOptions(withMarker)).toEqual({
      featureFlags: { allowHalfCoverForHide: true },
    })
  })

  it('OR-merges snapshot with temporary effects and markers', () => {
    expect(
      mergeHideEligibilityFeatureFlagsOr(
        { allowHalfCoverForHide: false },
        { allowHalfCoverForHide: true },
      ),
    ).toEqual({ allowHalfCoverForHide: true })
    const temp = resolveTemporaryHideEligibilityFeatureFlagsFromCombatantRuntime({
      activeEffects: [hideGrantHalfCover],
      conditions: [],
      states: [],
    })
    expect(
      mergeHideEligibilityFeatureFlagsOr({ allowHalfCoverForHide: undefined }, temp),
    ).toEqual({ allowHalfCoverForHide: true })
  })

  it('returns extension when only allowDimLightHide is set on snapshot', () => {
    const c = testEnemy('o', 'Orc', 20)
    const withDim = {
      ...c,
      stats: {
        ...c.stats,
        skillRuntime: { hideEligibilityFeatureFlags: { allowDimLightHide: true } },
      },
    }
    expect(getCombatantHideEligibilityExtensionOptions(withDim)).toEqual({
      featureFlags: { allowDimLightHide: true },
    })
  })

  it('OR-merges hide-eligibility-grant for difficult terrain and high wind', () => {
    const c = testEnemy('o', 'Orc', 20)
    const withGrants = {
      ...c,
      activeEffects: [
        {
          kind: 'hide-eligibility-grant' as const,
          featureFlags: { allowDifficultTerrainHide: true, allowHighWindHide: true },
        },
      ],
    }
    expect(getCombatantHideEligibilityExtensionOptions(withGrants)?.featureFlags).toEqual({
      allowDifficultTerrainHide: true,
      allowHighWindHide: true,
    })
  })
})
