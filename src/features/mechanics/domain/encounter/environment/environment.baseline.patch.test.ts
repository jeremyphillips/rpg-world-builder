import { describe, expect, it } from 'vitest'

import type { EncounterState } from '@/features/mechanics/domain/encounter/state/types'

import { updateEncounterEnvironmentBaseline } from '@/features/mechanics/domain/encounter/state/environment/environment-baseline-mutations'

import { applyEnvironmentBaselinePatch } from './environment.baseline.patch'
import { DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE } from './environment.resolve'

function emptyEncounterState(overrides: Partial<EncounterState> = {}): EncounterState {
  return {
    combatantsById: {},
    partyCombatantIds: [],
    enemyCombatantIds: [],
    initiative: [],
    initiativeOrder: [],
    activeCombatantId: null,
    turnIndex: 0,
    roundNumber: 1,
    started: true,
    log: [],
    ...overrides,
  }
}

describe('applyEnvironmentBaselinePatch', () => {
  it('overlays only provided keys', () => {
    const next = applyEnvironmentBaselinePatch(DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE, {
      lightingLevel: 'dim',
    })
    expect(next.lightingLevel).toBe('dim')
    expect(next.setting).toBe(DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE.setting)
  })

  it('replaces atmosphereTags entirely when present', () => {
    const base = {
      ...DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE,
      atmosphereTags: ['high-wind', 'underwater'] as const,
    }
    const next = applyEnvironmentBaselinePatch(base, { atmosphereTags: ['anti-magic'] })
    expect(next.atmosphereTags).toEqual(['anti-magic'])
  })
})

describe('updateEncounterEnvironmentBaseline', () => {
  it('updates state baseline and defaults missing baseline from DEFAULT', () => {
    const next = updateEncounterEnvironmentBaseline(
      emptyEncounterState({ environmentBaseline: undefined }),
      { visibilityObscured: 'light' },
    )
    expect(next.environmentBaseline?.visibilityObscured).toBe('light')
    expect(next.environmentBaseline?.lightingLevel).toBe(DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE.lightingLevel)
  })

  it('merges onto existing baseline', () => {
    const next = updateEncounterEnvironmentBaseline(
      emptyEncounterState({
        environmentBaseline: {
          ...DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE,
          lightingLevel: 'bright',
        },
      }),
      { lightingLevel: 'darkness' },
    )
    expect(next.environmentBaseline?.lightingLevel).toBe('darkness')
    expect(next.environmentBaseline?.setting).toBe(DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE.setting)
  })
})
