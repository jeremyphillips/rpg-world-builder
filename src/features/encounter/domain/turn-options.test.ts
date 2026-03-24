import { describe, expect, it } from 'vitest'

import {
  deriveBucketChrome,
  deriveBucketState,
  deriveTurnExhaustion,
} from './turn-options'

describe('deriveBucketState', () => {
  const defs = [{ id: 'a' }, { id: 'b' }]

  it('returns empty when no defs', () => {
    expect(deriveBucketState([])).toBe('empty')
  })

  it('returns available when availableIds is omitted', () => {
    expect(deriveBucketState(defs)).toBe('available')
  })

  it('returns available when at least one id matches', () => {
    expect(deriveBucketState(defs, ['b'])).toBe('available')
    expect(deriveBucketState(defs, ['a', 'x'])).toBe('available')
  })

  it('returns spent when defs exist but none match', () => {
    expect(deriveBucketState(defs, ['x', 'y'])).toBe('spent')
  })
})

describe('deriveBucketChrome', () => {
  it('maps states to title and defaultOpen', () => {
    expect(deriveBucketChrome('Actions', 'empty')).toEqual({
      title: 'Actions — none',
      defaultOpen: false,
    })
    expect(deriveBucketChrome('Bonus Actions', 'spent')).toEqual({
      title: 'Bonus Actions — spent',
      defaultOpen: false,
    })
    expect(deriveBucketChrome('Actions', 'available')).toEqual({
      title: 'Actions',
      defaultOpen: true,
    })
  })
})

describe('deriveTurnExhaustion', () => {
  it('is not spent when action bucket is available', () => {
    const r = deriveTurnExhaustion({
      actionState: 'available',
      bonusActionState: 'spent',
    })
    expect(r.hasAnyPrimaryOptionRemaining).toBe(true)
    expect(r.isFullySpent).toBe(false)
  })

  it('is not spent when bonus bucket is available', () => {
    const r = deriveTurnExhaustion({
      actionState: 'spent',
      bonusActionState: 'available',
    })
    expect(r.hasAnyPrimaryOptionRemaining).toBe(true)
    expect(r.isFullySpent).toBe(false)
  })

  it('empty bonus does not block exhaustion when action spent and no movement', () => {
    const r = deriveTurnExhaustion({
      actionState: 'spent',
      bonusActionState: 'empty',
    })
    expect(r.hasAnyPrimaryOptionRemaining).toBe(false)
    expect(r.isFullySpent).toBe(true)
  })

  it('counts positive movement', () => {
    const r = deriveTurnExhaustion({
      actionState: 'spent',
      bonusActionState: 'spent',
      movementRemaining: 15,
    })
    expect(r.hasAnyPrimaryOptionRemaining).toBe(true)
    expect(r.isFullySpent).toBe(false)
  })

  it('ignores movement when null or undefined', () => {
    const r = deriveTurnExhaustion({
      actionState: 'spent',
      bonusActionState: 'spent',
      movementRemaining: null,
    })
    expect(r.isFullySpent).toBe(true)
  })

  it('counts reaction when provided and available', () => {
    const r = deriveTurnExhaustion({
      actionState: 'spent',
      bonusActionState: 'spent',
      reactionState: 'available',
    })
    expect(r.hasAnyPrimaryOptionRemaining).toBe(true)
  })

  it('ignores reaction when omitted', () => {
    const r = deriveTurnExhaustion({
      actionState: 'spent',
      bonusActionState: 'spent',
    })
    expect(r.isFullySpent).toBe(true)
  })
})
