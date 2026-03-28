import { describe, expect, it } from 'vitest'

import { buildCharacterCombatantInstance, buildMonsterCombatantInstance } from '@/features/encounter/helpers/combatant-builders'
import type { CharacterDetailDto } from '@/features/character/read-model'
import type { Monster } from '@/features/content/monsters/domain/types'
import type { useCombatStats } from '@/features/character/hooks'
import {
  getCombatantAbilityScore,
  getPassivePerceptionScore,
  getStealthCheckModifier,
} from '@/features/mechanics/domain/encounter/state/awareness/passive-perception'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter/state/types/combatant.types'

function baseStats(): CombatantInstance['stats'] {
  return {
    armorClass: 14,
    maxHitPoints: 20,
    currentHitPoints: 20,
    initiativeModifier: 0,
    abilityScores: {
      strength: 10,
      dexterity: 14,
      constitution: 10,
      intelligence: 10,
      wisdom: 12,
      charisma: 10,
    },
    dexterityScore: 14,
  }
}

describe('passive-perception / stealth snapshot helpers', () => {
  it('getCombatantAbilityScore prefers abilityScores then dexterityScore for Dexterity', () => {
    expect(
      getCombatantAbilityScore(
        { ...baseStats(), abilityScores: { dexterity: 16 }, dexterityScore: 14 },
        'dexterity',
      ),
    ).toBe(16)
    expect(
      getCombatantAbilityScore({ ...baseStats(), abilityScores: undefined, dexterityScore: 15 }, 'dexterity'),
    ).toBe(15)
  })

  it('getCombatantAbilityScore resolves short ability ids (e.g. dex) via getAbilityScoreValue', () => {
    expect(
      getCombatantAbilityScore(
        {
          ...baseStats(),
          abilityScores: { dex: 18 } as CombatantInstance['stats']['abilityScores'],
          dexterityScore: 12,
        },
        'dexterity',
      ),
    ).toBe(18)
  })

  it('getPassivePerceptionScore: skillRuntime.passivePerception wins over stats.passivePerception', () => {
    const a: CombatantInstance = {
      instanceId: 'x',
      side: 'party',
      source: { kind: 'pc', sourceId: '1', label: 'A' },
      stats: {
        ...baseStats(),
        passivePerception: 99,
        skillRuntime: { passivePerception: 12 },
      },
      attacks: [],
      activeEffects: [],
      runtimeEffects: [],
      turnHooks: [],
      conditions: [],
      states: [],
    }
    expect(getPassivePerceptionScore(a)).toBe(12)
  })

  it('getPassivePerceptionScore: explicit stats.passivePerception when skillRuntime omits', () => {
    const a: CombatantInstance = {
      instanceId: 'x',
      side: 'party',
      source: { kind: 'pc', sourceId: '1', label: 'A' },
      stats: { ...baseStats(), passivePerception: 17 },
      attacks: [],
      activeEffects: [],
      runtimeEffects: [],
      turnHooks: [],
      conditions: [],
      states: [],
    }
    expect(getPassivePerceptionScore(a)).toBe(17)
  })

  it('getPassivePerceptionScore: derives 10 + Wis + PB × level when no explicit passive', () => {
    const a: CombatantInstance = {
      instanceId: 'x',
      side: 'party',
      source: { kind: 'pc', sourceId: '1', label: 'A' },
      stats: {
        ...baseStats(),
        abilityScores: { ...baseStats().abilityScores!, wisdom: 14 },
        skillRuntime: { proficiencyBonus: 2, perceptionProficiencyLevel: 1 },
      },
      attacks: [],
      activeEffects: [],
      runtimeEffects: [],
      turnHooks: [],
      conditions: [],
      states: [],
    }
    // Wis 14 → +2; 10 + 2 + 2 = 14
    expect(getPassivePerceptionScore(a)).toBe(14)
  })

  it('getPassivePerceptionScore: fallback 10 + Wis when PB missing', () => {
    const a: CombatantInstance = {
      instanceId: 'x',
      side: 'party',
      source: { kind: 'pc', sourceId: '1', label: 'A' },
      stats: {
        ...baseStats(),
        abilityScores: { ...baseStats().abilityScores!, wisdom: 14 },
        skillRuntime: { perceptionProficiencyLevel: 1 },
      },
      attacks: [],
      activeEffects: [],
      runtimeEffects: [],
      turnHooks: [],
      conditions: [],
      states: [],
    }
    expect(getPassivePerceptionScore(a)).toBe(12)
  })

  it('getStealthCheckModifier: stealthCheckModifierOverride wins', () => {
    const a: CombatantInstance = {
      instanceId: 'x',
      side: 'party',
      source: { kind: 'pc', sourceId: '1', label: 'A' },
      stats: {
        ...baseStats(),
        skillRuntime: { stealthCheckModifierOverride: 7, proficiencyBonus: 2, stealthProficiencyLevel: 1 },
      },
      attacks: [],
      activeEffects: [],
      runtimeEffects: [],
      turnHooks: [],
      conditions: [],
      states: [],
    }
    expect(getStealthCheckModifier(a)).toBe(7)
  })

  it('getStealthCheckModifier: Dex + PB × stealth level when override absent', () => {
    const a: CombatantInstance = {
      instanceId: 'x',
      side: 'party',
      source: { kind: 'pc', sourceId: '1', label: 'A' },
      stats: {
        ...baseStats(),
        skillRuntime: { proficiencyBonus: 2, stealthProficiencyLevel: 1 },
      },
      attacks: [],
      activeEffects: [],
      runtimeEffects: [],
      turnHooks: [],
      conditions: [],
      states: [],
    }
    // Dex 14 → +2; +2 PB = +4
    expect(getStealthCheckModifier(a)).toBe(4)
  })

  it('getStealthCheckModifier: Dex only when PB missing', () => {
    const a: CombatantInstance = {
      instanceId: 'x',
      side: 'party',
      source: { kind: 'pc', sourceId: '1', label: 'A' },
      stats: baseStats(),
      attacks: [],
      activeEffects: [],
      runtimeEffects: [],
      turnHooks: [],
      conditions: [],
      states: [],
    }
    expect(getStealthCheckModifier(a)).toBe(2)
  })
})

describe('combatant builders thread Perception / Stealth runtime', () => {
  const minimalCharacter = (overrides: Partial<CharacterDetailDto> = {}): CharacterDetailDto => ({
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
  })

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

  it('buildCharacterCombatantInstance sets skillRuntime proficiency and skill flags from detail DTO', () => {
    const c = buildCharacterCombatantInstance({
      runtimeId: 'r1',
      side: 'party',
      sourceKind: 'pc',
      character: minimalCharacter(),
      combatStats: mockCombatStats(3),
      attacks: [],
      turnHooks: [],
    })
    expect(c.stats.skillRuntime?.proficiencyBonus).toBe(3)
    expect(c.stats.skillRuntime?.perceptionProficiencyLevel).toBe(1)
    expect(c.stats.skillRuntime?.stealthProficiencyLevel).toBe(1)
    expect(c.stats.skillRuntime?.hideEligibilityFeatureFlags).toBeUndefined()
    expect(getPassivePerceptionScore(c)).toBe(10 + 2 + 3)
    expect(getStealthCheckModifier(c)).toBe(3 + 3)
  })

  it('buildCharacterCombatantInstance sets hideEligibilityFeatureFlags from authored feats (skulker)', () => {
    const c = buildCharacterCombatantInstance({
      runtimeId: 'r1',
      side: 'party',
      sourceKind: 'pc',
      character: minimalCharacter({
        feats: [{ id: 'skulker', name: 'Skulker' }],
      }),
      combatStats: mockCombatStats(3),
      attacks: [],
      turnHooks: [],
    })
    expect(c.stats.skillRuntime?.hideEligibilityFeatureFlags?.allowHalfCoverForHide).toBe(true)
  })

  const minimalMonster = (): Monster =>
    ({
      id: 'goblin',
      name: 'Goblin',
      type: 'humanoid',
      mechanics: {
        hitPoints: { count: 2, die: 6, modifier: 0 },
        armorClass: { value: 15 },
        movement: { ground: 30 },
        abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
        proficiencyBonus: 2,
        proficiencies: {
          skills: {
            perception: { proficiencyLevel: 1 },
            stealth: { proficiencyLevel: 2 },
          },
        },
        senses: { passivePerception: 13 },
      },
      lore: { alignment: 'neutral evil', xpValue: 50, challengeRating: 0.25 },
    }) as Monster

  it('buildMonsterCombatantInstance sets skillRuntime from mechanics and senses', () => {
    const m = buildMonsterCombatantInstance({
      runtimeId: 'm1',
      monster: minimalMonster(),
      attacks: [],
      initiativeModifier: 2,
      armorClass: 15,
      currentHitPoints: 7,
      activeEffects: [],
      turnHooks: [],
    })
    expect(m.stats.skillRuntime?.passivePerception).toBe(13)
    expect(m.stats.skillRuntime?.proficiencyBonus).toBe(2)
    expect(m.stats.skillRuntime?.perceptionProficiencyLevel).toBe(1)
    expect(m.stats.skillRuntime?.stealthProficiencyLevel).toBe(2)
    expect(getPassivePerceptionScore(m)).toBe(13)
    // Dex 14 → +2; stealth expertise 2×PB → +4; total +6
    expect(getStealthCheckModifier(m)).toBe(6)
  })

  it('buildMonsterCombatantInstance threads mechanics.hideEligibilityFeatureFlags into skillRuntime', () => {
    const base = minimalMonster()
    const monster = {
      ...base,
      mechanics: {
        ...base.mechanics,
        hideEligibilityFeatureFlags: { allowHalfCoverForHide: true },
      },
    } as typeof base
    const m = buildMonsterCombatantInstance({
      runtimeId: 'm1',
      monster,
      attacks: [],
      initiativeModifier: 2,
      armorClass: 15,
      currentHitPoints: 7,
      activeEffects: [],
      turnHooks: [],
    })
    expect(m.stats.skillRuntime?.hideEligibilityFeatureFlags?.allowHalfCoverForHide).toBe(true)
  })
})
