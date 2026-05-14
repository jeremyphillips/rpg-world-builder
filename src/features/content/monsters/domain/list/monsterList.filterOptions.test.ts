import { describe, expect, it } from 'vitest'
import { CREATURE_TYPE_DEFINITIONS } from '@/features/content/creatures/domain/values/creatureTaxonomy'
import { MONSTER_SIZE_FILTER_OPTIONS, MONSTER_TYPE_FILTER_OPTIONS } from './monsterList.filterOptions'

describe('monsterList.filterOptions', () => {
  it('adds an All row then maps creature type definitions', () => {
    expect(MONSTER_TYPE_FILTER_OPTIONS[0]).toEqual({ label: 'All', value: 'all' })
    const rest = MONSTER_TYPE_FILTER_OPTIONS.slice(1)
    expect(rest).toHaveLength(CREATURE_TYPE_DEFINITIONS.length)
    expect(rest.map((o) => o.value)).toEqual(CREATURE_TYPE_DEFINITIONS.map((r) => r.id))
    expect(rest[0]!.label).toBe(CREATURE_TYPE_DEFINITIONS[0]!.name)
  })

  it('mirrors size definitions after All for size filter', () => {
    expect(MONSTER_SIZE_FILTER_OPTIONS[0]).toEqual({ label: 'All', value: 'all' })
    expect(MONSTER_SIZE_FILTER_OPTIONS.length).toBe(1 + 6)
  })
})
