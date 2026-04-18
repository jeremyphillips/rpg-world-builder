import { describe, expect, it } from 'vitest'

import type { CharacterClass } from '@/features/content/classes/domain/types'
import { buildCharacterQueryContext } from '@/features/character/domain/query/buildCharacterQueryContext'
import type { Character } from '@/features/character/domain/types'
import { getDarkvisionRange } from '@/features/content/shared/domain/vocab/creatureSenses.selectors'

import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds'
import { getSystemRace } from '@/features/mechanics/domain/rulesets/system/races'

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
  it('has empty senses when character has no race', () => {
    const character = minimalCharacter()
    const query = buildCharacterQueryContext(character)
    const derived = buildCharacterDerivedContext({ character, query })
    expect(derived.senses.special).toEqual([])
  })

  it('applies system race darkvision grants (elf 60, dwarf 120, dragonborn 60, gnome 60, orc 120, tiefling 60)', () => {
    const cases: { race: string; ft: number }[] = [
      { race: 'elf', ft: 60 },
      { race: 'dwarf', ft: 120 },
      { race: 'dragonborn', ft: 60 },
      { race: 'gnome', ft: 60 },
      { race: 'orc', ft: 120 },
      { race: 'tiefling', ft: 60 },
    ]
    for (const { race, ft } of cases) {
      const character = minimalCharacter({ race })
      const query = buildCharacterQueryContext(character)
      const derived = buildCharacterDerivedContext({ character, query })
      expect(getDarkvisionRange(derived.senses), race).toBe(ft)
    }
  })

  it('uses max darkvision when elf selects drow lineage (60 base + 120 option → 120 ft)', () => {
    const character = minimalCharacter({
      race: 'elf',
      raceChoices: { 'elven-lineage': 'drow' },
    })
    const query = buildCharacterQueryContext(character)
    const derived = buildCharacterDerivedContext({ character, query })
    expect(getDarkvisionRange(derived.senses)).toBe(120)
    const elfRace = getSystemRace(DEFAULT_SYSTEM_RULESET_ID, 'elf')
    expect(elfRace?.definitionGroups?.[0]?.id).toBe('elven-lineage')
  })

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
