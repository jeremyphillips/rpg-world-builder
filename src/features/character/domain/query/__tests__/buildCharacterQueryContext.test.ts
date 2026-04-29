import { describe, expect, it } from 'vitest'

import type { CharacterDetailDto } from '@/features/character/read-model'
import { toCharacterForEngine } from '@/features/character/read-model'

import { buildCharacterQueryContext, createEmptyCharacterQueryContext } from '../buildCharacterQueryContext'
import { buildCharacterQueryContextFromDetailDto } from '../buildCharacterQueryContextFromDetailDto'

function minimalDto(overrides: Partial<CharacterDetailDto> = {}): CharacterDetailDto {
  return {
    id: 'c1',
    _id: 'c1',
    name: 'Hero',
    type: 'pc',
    imageUrl: null,
    race: { id: 'human', name: 'Human' },
    classes: [{ classId: 'fighter', className: 'Fighter', level: 3, subclassId: null }],
    level: 3,
    totalLevel: 3,
    abilityScores: {
      strength: 16,
      dexterity: 12,
      constitution: 14,
      intelligence: 10,
      wisdom: 10,
      charisma: 8,
    },
    proficiencies: [{ id: 'athletics', name: 'Athletics', proficiency: 'proficient' }],
    equipment: {
      armor: [{ id: 'chain-mail', name: 'Chain Mail' }],
      weapons: [{ id: 'longsword', name: 'Longsword' }],
      gear: [{ id: 'backpack', name: 'Backpack' }],
      magicItems: ['cloak-of-elvenkind'],
    },
    wealth: { gp: 2, sp: 1, cp: 5 },
    hitPoints: { total: 24 },
    armorClass: { current: 18 },
    combat: {
      loadout: {
        armorId: 'chain-mail',
        shieldId: 'shield',
        mainHandWeaponId: 'longsword',
        offHandWeaponId: 'torch',
      },
    },
    spells: ['fire-bolt'],
    campaigns: [],
    ...overrides,
  }
}

describe('createEmptyCharacterQueryContext', () => {
  it('returns zeroed phase-1 shape', () => {
    const empty = createEmptyCharacterQueryContext()
    expect(empty.identity.id).toBe('')
    expect(empty.progression.totalLevel).toBe(0)
    expect(empty.inventory.weaponIds.size).toBe(0)
    expect(empty.economy.totalWealthCp).toBe(0)
  })
})

describe('buildCharacterQueryContext', () => {
  it('maps identity, progression, inventory, spells, proficiencies, wealth, and combat slots', () => {
    const ctx = buildCharacterQueryContext(toCharacterForEngine(minimalDto()))
    expect(ctx.identity).toEqual({
      id: 'c1',
      name: 'Hero',
      type: 'pc',
      raceId: 'human',
      alignmentId: null,
    })
    expect(ctx.progression.totalLevel).toBe(3)
    expect(ctx.progression.classIds.has('fighter')).toBe(true)
    expect(ctx.progression.classLevelsById.get('fighter')).toBe(3)
    expect(ctx.progression.xp).toBe(0)
    expect(ctx.inventory.weaponIds.has('longsword')).toBe(true)
    expect(ctx.inventory.armorIds.has('chain-mail')).toBe(true)
    expect(ctx.inventory.gearIds.has('backpack')).toBe(true)
    expect(ctx.inventory.magicItemIds.has('cloak-of-elvenkind')).toBe(true)
    expect(ctx.inventory.allEquipmentIds.has('longsword')).toBe(true)
    expect(ctx.proficiencies.skillIds.has('athletics')).toBe(true)
    expect(ctx.spells.knownSpellIds.has('fire-bolt')).toBe(true)
    expect(ctx.economy.totalWealthCp).toBe(215)
    expect(ctx.combat).toEqual({
      equippedArmorId: 'chain-mail',
      equippedShieldId: 'shield',
      equippedMainHandWeaponId: 'longsword',
      equippedOffHandWeaponId: 'torch',
    })
  })

  it('uses max level when the same class appears more than once', () => {
    const dto = minimalDto({
      classes: [
        { classId: 'fighter', className: 'Fighter', level: 2, subclassId: null },
        { classId: 'fighter', className: 'Fighter', level: 1, subclassId: null },
      ],
    })
    const ctx = buildCharacterQueryContext(toCharacterForEngine(dto))
    expect(ctx.progression.classLevelsById.get('fighter')).toBe(2)
  })
})

describe('buildCharacterQueryContextFromDetailDto', () => {
  it('matches buildCharacterQueryContext(toCharacterForEngine(dto))', () => {
    const dto = minimalDto()
    const a = buildCharacterQueryContext(toCharacterForEngine(dto))
    const b = buildCharacterQueryContextFromDetailDto(dto)
    expect(b.identity).toEqual(a.identity)
    expect(b.inventory.magicItemIds).toEqual(a.inventory.magicItemIds)
    expect(b.spells.knownSpellIds).toEqual(a.spells.knownSpellIds)
  })
})
