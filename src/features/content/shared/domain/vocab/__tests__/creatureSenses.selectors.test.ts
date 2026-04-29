import { describe, expect, it } from 'vitest'

import {
  getCreatureSenseRange,
  getDarkvisionRange,
  hasCreatureSense,
  normalizeCreatureSenses,
} from '../creatureSenses.selectors'
import { getCreatureSenseTypeDisplayName } from '../creatureSenses.vocab'

describe('normalizeCreatureSenses', () => {
  it('defaults missing special to empty array', () => {
    expect(normalizeCreatureSenses({ passivePerception: 12 })).toEqual({
      special: [],
      passivePerception: 12,
    })
  })

  it('preserves special entries', () => {
    const s = normalizeCreatureSenses({
      special: [{ type: 'darkvision', range: 60 }],
    })
    expect(s.special).toEqual([{ type: 'darkvision', range: 60 }])
  })
})

describe('getDarkvisionRange / getCreatureSenseRange', () => {
  it('returns numeric darkvision range', () => {
    const senses = {
      special: [{ type: 'darkvision' as const, range: 60 }],
    }
    expect(getDarkvisionRange(senses)).toBe(60)
    expect(getCreatureSenseRange(senses, 'darkvision')).toBe(60)
  })

  it('chooses highest range when multiple darkvision entries exist', () => {
    expect(
      getDarkvisionRange({
        special: [
          { type: 'darkvision', range: 60 },
          { type: 'darkvision', range: 120 },
        ],
      }),
    ).toBe(120)
  })

  it('returns undefined when darkvision is absent', () => {
    expect(getDarkvisionRange({ special: [] })).toBeUndefined()
    expect(getDarkvisionRange(undefined)).toBeUndefined()
  })

  it('does not invent range when darkvision has no numeric range', () => {
    expect(getDarkvisionRange({ special: [{ type: 'darkvision' }] })).toBeUndefined()
  })

  it('truesight range resolves via getCreatureSenseRange', () => {
    expect(
      getCreatureSenseRange(
        { special: [{ type: 'truesight', range: 120 }] },
        'truesight',
      ),
    ).toBe(120)
  })
})

describe('hasCreatureSense', () => {
  it('is true when type present', () => {
    expect(hasCreatureSense({ special: [{ type: 'truesight', range: 60 }] }, 'truesight')).toBe(true)
  })

  it('is false when type absent', () => {
    expect(hasCreatureSense({ special: [{ type: 'darkvision', range: 60 }] }, 'truesight')).toBe(false)
  })
})

describe('getCreatureSenseTypeDisplayName', () => {
  it('returns labels for known sense types', () => {
    expect(getCreatureSenseTypeDisplayName('darkvision')).toBe('Darkvision')
    expect(getCreatureSenseTypeDisplayName('truesight')).toBe('Truesight')
  })

  it('returns undefined for unknown id', () => {
    expect(getCreatureSenseTypeDisplayName('not-a-sense')).toBeUndefined()
  })
})
