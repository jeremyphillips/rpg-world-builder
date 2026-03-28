import { describe, expect, it } from 'vitest'

import { createSquareGridSpace } from '@/features/encounter/space/creation/createSquareGridSpace'
import { buildCharacterCombatantInstance } from '@/features/encounter/helpers/combatants'
import type { CharacterDetailDto } from '@/features/character/read-model'
import type { useCombatStats } from '@/features/character/hooks'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter/state/types'
import {
  createEncounterState,
  getCombatantHideEligibilityExtensionOptions,
  getHideAttemptEligibilityDenialReason,
  resolveHideWithPassivePerception,
} from '@/features/mechanics/domain/encounter/state'

import {
  encounterAttackerOutsideDefenderHeavilyObscured,
  encounterAttackerOutsideDefenderMagicalDarknessCell,
  testEnemy,
} from './encounter-visibility-test-fixtures'

const hideEligibilityGrantHalfCover = {
  kind: 'hide-eligibility-grant' as const,
  featureFlags: { allowHalfCoverForHide: true },
}

const hideEligibilityGrantDimLight = {
  kind: 'hide-eligibility-grant' as const,
  featureFlags: { allowDimLightHide: true },
}

function minimalCharacter(overrides: Partial<CharacterDetailDto> = {}): CharacterDetailDto {
  return {
    id: 'c1',
    _id: 'c1',
    name: 'Rogue',
    type: 'pc',
    imageUrl: null,
    race: null,
    classes: [{ classId: 'rogue', className: 'Rogue', level: 5, subclassId: null }],
    level: 5,
    totalLevel: 5,
    abilityScores: {
      strength: 10,
      dexterity: 16,
      constitution: 12,
      intelligence: 10,
      wisdom: 14,
      charisma: 10,
    },
    proficiencies: [
      { id: 'perception', name: 'Perception' },
      { id: 'stealth', name: 'Stealth' },
    ],
    equipment: { armor: [], weapons: [], gear: [] },
    wealth: {},
    hitPoints: { total: 30 },
    armorClass: { current: 15 },
    combat: {},
    campaigns: [],
    ...overrides,
  }
}

const mockCombatStats = (pb: number): ReturnType<typeof useCombatStats> =>
  ({
    armorClass: 15,
    maxHp: 30,
    initiative: 3,
    proficiencyBonus: pb,
    activeEffects: [],
    calculatedArmorClass: { value: 15, breakdown: [] },
    loadoutOptions: [],
    activeLoadout: null,
    activeOption: null,
    attacks: [],
    weaponOptions: [],
    wieldedWeaponIds: [],
  }) as ReturnType<typeof useCombatStats>

describe('hide eligibility from authored character feats (runtime)', () => {
  it('getCombatantHideEligibilityExtensionOptions reflects builder output from skulker feat', () => {
    const rogue = buildCharacterCombatantInstance({
      runtimeId: 'rogue',
      side: 'party',
      sourceKind: 'pc',
      character: minimalCharacter({ feats: [{ id: 'skulker', name: 'Skulker' }] }),
      combatStats: mockCombatStats(3),
      attacks: [],
      turnHooks: [],
    })
    expect(getCombatantHideEligibilityExtensionOptions(rogue)?.featureFlags?.allowHalfCoverForHide).toBe(true)
  })

  it('half-cover grid: hide entry and sustain use combatant-derived flags without StealthRulesOptions', () => {
    const wiz = testEnemy('wiz', 'Wizard', 20)
    const rogue = buildCharacterCombatantInstance({
      runtimeId: 'rogue',
      side: 'party',
      sourceKind: 'pc',
      character: minimalCharacter({ feats: [{ id: 'skulker', name: 'Skulker' }] }),
      combatStats: mockCombatStats(3),
      attacks: [],
      turnHooks: [],
    })
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const base = createEncounterState([rogue, wiz], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'rogue', cellId: 'c-1-0' },
        { combatantId: 'wiz', cellId: 'c-0-0' },
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
      combatantsById: {
        ...base.combatantsById,
        wiz: {
          ...base.combatantsById.wiz!,
          stats: { ...base.combatantsById.wiz!.stats, passivePerception: 10 },
        },
      },
    }
    expect(getHideAttemptEligibilityDenialReason(state, 'rogue', 'wiz')).toBe(null)

    const beat = resolveHideWithPassivePerception(state, 'rogue', 11)
    expect(beat.state.combatantsById.rogue?.stealth?.hideEligibility?.featureFlags?.allowHalfCoverForHide).toBe(true)
    expect(beat.state.combatantsById.rogue?.stealth?.hiddenFromObserverIds).toContain('wiz')
  })
})

describe('temporary runtime hide permissions (same resolver seam)', () => {
  function halfCoverEncounter(rogueOverrides: Partial<CombatantInstance>) {
    const wiz = testEnemy('wiz', 'Wizard', 20)
    const rogueBase = buildCharacterCombatantInstance({
      runtimeId: 'rogue',
      side: 'party',
      sourceKind: 'pc',
      character: minimalCharacter({ feats: [] }),
      combatStats: mockCombatStats(3),
      attacks: [],
      turnHooks: [],
    })
    const rogue = { ...rogueBase, ...rogueOverrides }
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const base = createEncounterState([rogue, wiz], { rng: () => 0.5, space })
    return {
      ...base,
      placements: [
        { combatantId: 'rogue', cellId: 'c-1-0' },
        { combatantId: 'wiz', cellId: 'c-0-0' },
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
      combatantsById: {
        ...base.combatantsById,
        wiz: {
          ...base.combatantsById.wiz!,
          stats: { ...base.combatantsById.wiz!.stats, passivePerception: 10 },
        },
        rogue,
      },
    }
  }

  it('half-cover only: no feat and no temporary grant denies hide attempt', () => {
    const state = halfCoverEncounter({})
    expect(getHideAttemptEligibilityDenialReason(state, 'rogue', 'wiz')).toBe('observer-sees-without-concealment')
  })

  it('half-cover: hide-eligibility-grant on activeEffects allows entry and sustain like authored feat', () => {
    const state = halfCoverEncounter({ activeEffects: [hideEligibilityGrantHalfCover] })
    expect(getHideAttemptEligibilityDenialReason(state, 'rogue', 'wiz')).toBe(null)
    expect(getCombatantHideEligibilityExtensionOptions(state.combatantsById.rogue!)?.featureFlags?.allowHalfCoverForHide).toBe(
      true,
    )
    const beat = resolveHideWithPassivePerception(state, 'rogue', 11)
    expect(beat.state.combatantsById.rogue?.stealth?.hideEligibility?.featureFlags?.allowHalfCoverForHide).toBe(true)
    expect(beat.state.combatantsById.rogue?.stealth?.hiddenFromObserverIds).toContain('wiz')
  })

  it('authored skulker OR-merges with temporary grant (both true)', () => {
    const rogueBase = buildCharacterCombatantInstance({
      runtimeId: 'rogue',
      side: 'party',
      sourceKind: 'pc',
      character: minimalCharacter({ feats: [{ id: 'skulker', name: 'Skulker' }] }),
      combatStats: mockCombatStats(3),
      attacks: [],
      turnHooks: [],
    })
    const rogue = { ...rogueBase, activeEffects: [hideEligibilityGrantHalfCover] }
    expect(getCombatantHideEligibilityExtensionOptions(rogue)?.featureFlags?.allowHalfCoverForHide).toBe(true)
  })

  it('baseline: heavy obscurement and magical darkness hide eligibility unchanged (no regression)', () => {
    expect(getHideAttemptEligibilityDenialReason(encounterAttackerOutsideDefenderHeavilyObscured(), 'orc', 'wiz')).toBe(null)
    expect(
      getHideAttemptEligibilityDenialReason(encounterAttackerOutsideDefenderMagicalDarknessCell(), 'orc', 'wiz'),
    ).toBe(null)
  })

  it('dim-only: temporary grant enables hide entry and sustain (same seam as half cover)', () => {
    const wiz = testEnemy('wiz', 'Wizard', 20)
    const rogueBase = buildCharacterCombatantInstance({
      runtimeId: 'rogue',
      side: 'party',
      sourceKind: 'pc',
      character: minimalCharacter({ feats: [] }),
      combatStats: mockCombatStats(3),
      attacks: [],
      turnHooks: [],
    })
    const rogue = { ...rogueBase, activeEffects: [hideEligibilityGrantDimLight] }
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const base = createEncounterState([rogue, wiz], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'rogue', cellId: 'c-1-0' },
        { combatantId: 'wiz', cellId: 'c-0-0' },
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
      combatantsById: {
        ...base.combatantsById,
        wiz: {
          ...base.combatantsById.wiz!,
          stats: { ...base.combatantsById.wiz!.stats, passivePerception: 10 },
        },
        rogue,
      },
    }
    expect(getHideAttemptEligibilityDenialReason(state, 'rogue', 'wiz')).toBe(null)
    const beat = resolveHideWithPassivePerception(state, 'rogue', 11)
    expect(beat.state.combatantsById.rogue?.stealth?.hideEligibility?.featureFlags?.allowDimLightHide).toBe(true)
    expect(beat.state.combatantsById.rogue?.stealth?.hiddenFromObserverIds).toContain('wiz')
  })
})
