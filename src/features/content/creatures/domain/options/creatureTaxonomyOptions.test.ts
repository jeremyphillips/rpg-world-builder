import { describe, expect, it } from 'vitest'
import {
  CREATURE_TAXONOMY_FILTER_ALL,
  getAllowedSubtypeOptionsForCreatureType,
  getCreatureSizeFilterOptions,
  getCreatureTypeFilterOptions,
} from './creatureTaxonomyOptions'

describe('creatureTaxonomyOptions', () => {
  it('builds subtype select rows from allowed ids and catalog names', () => {
    const opts = getAllowedSubtypeOptionsForCreatureType('fiend')
    expect(opts).toEqual([
      { value: 'demon', label: 'Demon' },
      { value: 'devil', label: 'Devil' },
      { value: 'shapechanger', label: 'Shapechanger' },
    ])
  })

  it('exposes a shared "All" sentinel for type/size filters', () => {
    expect(CREATURE_TAXONOMY_FILTER_ALL).toBe('all')
    const typeOpts = getCreatureTypeFilterOptions()
    expect(typeOpts[0]).toEqual({ label: 'All', value: 'all' })
    const sizeOpts = getCreatureSizeFilterOptions()
    expect(sizeOpts[0]).toEqual({ label: 'All', value: 'all' })
  })
})
