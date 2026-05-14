import { describe, expect, it } from 'vitest'

import {
  clampMinMaxToSteps,
  deriveSortedUniqueNumericSteps,
  indexRangeToValues,
  valuesToIndexRange,
} from '../filters/discreteNumericRange'

describe('deriveSortedUniqueNumericSteps', () => {
  it('returns sorted unique values from rows', () => {
    const rows = [{ n: 2 }, { n: 0.25 }, { n: 2 }, { n: undefined }]
    expect(deriveSortedUniqueNumericSteps(rows, (r) => r.n)).toEqual([0.25, 2])
  })

  it('returns empty array when no numeric values', () => {
    expect(
      deriveSortedUniqueNumericSteps([{ n: null }], (r) => r.n as unknown as number | undefined),
    ).toEqual([])
  })
})

describe('clampMinMaxToSteps', () => {
  const steps = [0.25, 1, 5]

  it('clamps to step bounds', () => {
    expect(clampMinMaxToSteps({ min: -1, max: 99 }, steps)).toEqual({
      min: 0.25,
      max: 5,
    })
  })

  it('orders min and max when reversed', () => {
    expect(clampMinMaxToSteps({ min: 5, max: 0.25 }, steps)).toEqual({
      min: 0.25,
      max: 5,
    })
  })
})

describe('valuesToIndexRange / indexRangeToValues', () => {
  const steps = [0, 0.25, 1, 5]

  it('round-trips indices', () => {
    const [a, b] = valuesToIndexRange(steps, 0.25, 5)
    expect(indexRangeToValues(steps, a, b)).toEqual({ min: 0.25, max: 5 })
  })
})
