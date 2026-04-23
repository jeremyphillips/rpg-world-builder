import { describe, expect, it } from 'vitest'
import {
  creatureTypeHasRuleTag,
  CREATURE_TYPE_DEFINITIONS,
  EXTRAPLANAR_CREATURE_TYPE_IDS,
  getAllowedSubtypeIdsForCreatureType,
  isSubtypeAllowedForCreatureType,
} from './creatureTaxonomy'

const STABLE_TYPE_IDS = [
  'aberration',
  'animal',
  'beast',
  'celestial',
  'construct',
  'dragon',
  'elemental',
  'fey',
  'fiend',
  'giant',
  'humanoid',
  'monstrosity',
  'ooze',
  'plant',
  'undead',
  'vermin',
] as const

describe('creatureTaxonomy', () => {
  it('keeps a stable set of creature type ids', () => {
    expect(CREATURE_TYPE_DEFINITIONS.map((r) => r.id)).toEqual([...STABLE_TYPE_IDS])
  })

  it('marks fey and dragon extraplanar rule usage correctly', () => {
    expect(creatureTypeHasRuleTag('fey', 'extraplanar')).toBe(true)
    expect(creatureTypeHasRuleTag('dragon', 'extraplanar')).toBe(false)
  })

  it('keeps EXTRAPLANAR_CREATURE_TYPE_IDS aligned with the extraplanar tag', () => {
    expect([...EXTRAPLANAR_CREATURE_TYPE_IDS].sort()).toEqual(
      [
        'aberration',
        'celestial',
        'elemental',
        'fey',
        'fiend',
        'undead',
      ].sort(),
    )
  })

  it('restricts subtypes by creature type', () => {
    const humanoidSub = getAllowedSubtypeIdsForCreatureType('humanoid')
    expect(humanoidSub).toEqual(
      expect.arrayContaining(['dwarf', 'elf', 'goblinoid', 'gnome', 'aquatic', 'orc']),
    )
    expect(humanoidSub).toHaveLength(14)
    expect(getAllowedSubtypeIdsForCreatureType('elemental').sort()).toEqual(['air', 'earth', 'fire', 'water'])
    expect(getAllowedSubtypeIdsForCreatureType('fiend').sort()).toEqual(
      ['demon', 'devil', 'shapechanger'].sort(),
    )
    expect(isSubtypeAllowedForCreatureType('beast', 'aquatic')).toBe(true)
    expect(isSubtypeAllowedForCreatureType('beast', 'swarm')).toBe(true)
    expect(isSubtypeAllowedForCreatureType('undead', 'shapechanger')).toBe(true)
    expect(isSubtypeAllowedForCreatureType('dragon', 'goblinoid')).toBe(false)
  })
})
