import { describe, expect, it } from 'vitest'

import type { CharacterClass } from '@/features/content/classes/domain/types'
import { buildCharacterQueryContext } from '@/features/character/domain/query/buildCharacterQueryContext'
import type { Character } from '@/features/character/domain/types'

import { buildCharacterDerivedContext } from '../buildCharacterDerivedContext'
import {
  hasEffectiveArmorProficiency,
  hasEffectiveToolProficiency,
  hasEffectiveWeaponProficiency,
} from '../selectors/proficiency.selectors'

function minimalCharacter(overrides: Partial<Character> = {}): Character {
  return {
    name: 'Hero',
    type: 'pc',
    classes: [{ classId: 'fighter', level: 1 }],
    xp: 0,
    totalLevel: 1,
    ...overrides,
  }
}

describe('buildCharacterDerivedContext', () => {
  it('merges fighter weapon categories (simple, martial) and armor (allArmor, shields)', () => {
    const character = minimalCharacter({ classes: [{ classId: 'fighter', level: 3 }] })
    const query = buildCharacterQueryContext(character)
    const derived = buildCharacterDerivedContext({ character, query })

    expect(derived.proficiencies.granted.weapon.categories).toEqual(expect.arrayContaining(['simple', 'martial']))
    expect(derived.proficiencies.granted.armor.categories).toEqual(expect.arrayContaining(['allArmor', 'shields']))

    expect(hasEffectiveWeaponProficiency(derived, { id: 'longsword', category: 'martial' })).toBe(true)
    expect(hasEffectiveWeaponProficiency(derived, { id: 'club', category: 'simple' })).toBe(true)
    expect(hasEffectiveArmorProficiency(derived, { id: 'chain-mail', category: 'heavy' })).toBe(true)
    expect(hasEffectiveArmorProficiency(derived, { id: 'shield', category: 'shields' })).toBe(true)
  })

  it('multiclass merges weapon and armor grants without duplicate categories', () => {
    const character = minimalCharacter({
      classes: [
        { classId: 'fighter', level: 2 },
        { classId: 'cleric', level: 1 },
      ],
      totalLevel: 3,
    })
    const query = buildCharacterQueryContext(character)
    const derived = buildCharacterDerivedContext({ character, query })

    const w = derived.proficiencies.effective.weapon
    expect(w.categories.filter((c) => c === 'simple').length).toBe(1)
    expect(w.categories).toEqual(expect.arrayContaining(['simple', 'martial']))
    expect(derived.proficiencies.effective.armor.categories).toEqual(
      expect.arrayContaining(['allArmor', 'shields', 'light', 'medium']),
    )
  })

  it('grants rogue thieves-tools when level meets tools.level', () => {
    const character = minimalCharacter({ classes: [{ classId: 'rogue', level: 1 }] })
    const query = buildCharacterQueryContext(character)
    const derived = buildCharacterDerivedContext({ character, query })

    expect(derived.proficiencies.granted.toolIds.has('thieves-tools')).toBe(true)
    expect(hasEffectiveToolProficiency(derived, 'thieves-tools')).toBe(true)
  })

  it('does not grant tools when class level is below tools.level', () => {
    const homebrew: CharacterClass = {
      id: 'brew-tools',
      name: 'Brew',
      requirements: { allowedRaces: 'all', allowedAlignments: 'any' },
      generation: { primaryAbilities: ['dex'] },
      progression: {
        hitDie: 8,
        attackProgression: 'average',
        savingThrows: ['dex', 'int'],
        spellcasting: 'none',
        asiLevels: [],
        features: [],
      },
      proficiencies: {
        skills: { type: 'choice', choose: 0, level: 1, from: [] },
        weapons: { type: 'fixed', level: 1, categories: ['simple'], items: [] },
        armor: { type: 'fixed', level: 1, categories: ['light'], items: [] },
        tools: { type: 'fixed', level: 5, items: ['thieves-tools'] },
      },
    }
    const character = minimalCharacter({
      classes: [{ classId: 'brew-tools', level: 1 }],
    })
    const query = buildCharacterQueryContext(character)
    const derived = buildCharacterDerivedContext({
      character,
      query,
      catalogs: { classesById: new Map([['brew-tools', homebrew]]) },
    })

    expect(derived.proficiencies.granted.toolIds.has('thieves-tools')).toBe(false)
  })

  it('uses classesById for homebrew weapon item grants', () => {
    const homebrew: CharacterClass = {
      id: 'brew-wpn',
      name: 'Brew',
      requirements: { allowedRaces: 'all', allowedAlignments: 'any' },
      generation: { primaryAbilities: ['str'] },
      progression: {
        hitDie: 10,
        attackProgression: 'good',
        savingThrows: ['str', 'con'],
        spellcasting: 'none',
        asiLevels: [],
        features: [],
      },
      proficiencies: {
        skills: { type: 'choice', choose: 0, level: 1, from: [] },
        weapons: { type: 'fixed', level: 1, categories: [], items: ['unique-gun-id'] },
        armor: { type: 'fixed', level: 1, categories: ['light'], items: [] },
      },
    }
    const character = minimalCharacter({ classes: [{ classId: 'brew-wpn', level: 1 }] })
    const query = buildCharacterQueryContext(character)
    const derived = buildCharacterDerivedContext({
      character,
      query,
      catalogs: { classesById: new Map([['brew-wpn', homebrew]]) },
    })

    expect(hasEffectiveWeaponProficiency(derived, { id: 'unique-gun-id', category: 'martial' })).toBe(true)
  })

  it('flows base skill ids from CharacterQueryContext', () => {
    const character = minimalCharacter({
      proficiencies: { skills: { athletics: { proficiencyLevel: 1 }, stealth: { proficiencyLevel: 1 } } },
    })
    const query = buildCharacterQueryContext(character)
    const derived = buildCharacterDerivedContext({ character, query })

    expect(query.proficiencies.skillIds.has('athletics')).toBe(true)
    expect(derived.proficiencies.effective.skillIds.has('athletics')).toBe(true)
    expect(derived.proficiencies.effective.skillIds.has('stealth')).toBe(true)
  })
})
