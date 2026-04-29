import { describe, expect, it } from 'vitest'
import {
  getCreatureSizeDisplayName,
  getCreatureSubtypeDisplayName,
  getCreatureTypeDisplayName,
} from './creatureTaxonomyDisplay'

describe('creatureTaxonomyDisplay', () => {
  it('resolves known ids to labels and passes through unknown ids', () => {
    expect(getCreatureTypeDisplayName('dragon')).toBe('Dragon')
    expect(getCreatureTypeDisplayName('not-a-type')).toBe('not-a-type')
    expect(getCreatureSubtypeDisplayName('goblinoid')).toBe('Goblinoid')
    expect(getCreatureSubtypeDisplayName('x-unknown')).toBe('x-unknown')
    expect(getCreatureSizeDisplayName('huge')).toBe('Huge')
    expect(getCreatureSizeDisplayName('nope')).toBe('nope')
  })

  it('treats null and empty as an em dash', () => {
    expect(getCreatureTypeDisplayName(null)).toBe('—')
    expect(getCreatureTypeDisplayName('')).toBe('—')
    expect(getCreatureSubtypeDisplayName(undefined)).toBe('—')
    expect(getCreatureSizeDisplayName('')).toBe('—')
  })
})
