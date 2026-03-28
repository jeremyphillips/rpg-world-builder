import { describe, expect, it } from 'vitest'

import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'

import {
  deriveBucketChrome,
  deriveBucketState,
  deriveTurnExhaustion,
  deriveTurnResourceBucketState,
  partitionCombatantActionBuckets,
  turnResourceBucketHeaderBadge,
} from '../../turn/turn-options'

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

describe('partitionCombatantActionBuckets', () => {
  it('splits standard vs bonus like the action drawer', () => {
    const std = { id: 'a', cost: { action: true }, label: 'a', kind: 'weapon-attack' } as CombatActionDefinition
    const bon = { id: 'b', cost: { bonusAction: true }, label: 'b', kind: 'weapon-attack' } as CombatActionDefinition
    const both = { id: 'c', cost: { action: true, bonusAction: true }, label: 'c', kind: 'spell' } as CombatActionDefinition
    const { actionDefs, bonusDefs } = partitionCombatantActionBuckets([std, bon, both])
    expect(actionDefs.map((a) => a.id)).toEqual(['a'])
    expect(bonusDefs.map((a) => a.id)).toEqual(['b', 'c'])
  })
})

describe('deriveTurnResourceBucketState', () => {
  const one = [{ id: 'x' }]

  it('is empty when no defs regardless of slot', () => {
    expect(deriveTurnResourceBucketState([], true)).toBe('empty')
    expect(deriveTurnResourceBucketState([], false)).toBe('empty')
  })

  it('follows slot when defs exist', () => {
    expect(deriveTurnResourceBucketState(one, true)).toBe('available')
    expect(deriveTurnResourceBucketState(one, false)).toBe('spent')
  })
})

describe('turnResourceBucketHeaderBadge', () => {
  it('maps bucket state to compact labels', () => {
    expect(turnResourceBucketHeaderBadge('empty', 'action')).toEqual({ label: 'Action —', tone: 'default' })
    expect(turnResourceBucketHeaderBadge('spent', 'action')).toEqual({ label: 'Action ○', tone: 'default' })
    expect(turnResourceBucketHeaderBadge('available', 'action')).toEqual({ label: 'Action ●', tone: 'success' })
    expect(turnResourceBucketHeaderBadge('empty', 'bonus')).toEqual({ label: 'Bonus —', tone: 'default' })
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
})