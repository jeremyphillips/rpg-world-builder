import { describe, expect, it } from 'vitest'

import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'

import { deriveRecommendedActionsForTarget } from '../../actions/derive-recommended-actions-for-target'

function act(partial: Partial<CombatActionDefinition>): CombatActionDefinition {
  return {
    id: 'a',
    label: 'A',
    kind: 'weapon-attack',
    cost: { action: true },
    resolutionMode: 'attack-roll',
    attackProfile: { attackBonus: 5 },
    targeting: { kind: 'single-target', rangeFt: 5 },
    displayMeta: { source: 'weapon' },
    ...partial,
  } as CombatActionDefinition
}

describe('deriveRecommendedActionsForTarget', () => {
  it('excludes self-target Hide from the For-this-target strip', () => {
    const actions: CombatActionDefinition[] = [
      act({ id: 'slash', label: 'Slash' }),
      {
        id: 'hide',
        label: 'Hide',
        kind: 'combat-effect',
        cost: { action: true },
        resolutionMode: 'hide',
        targeting: { kind: 'self' },
      },
    ]
    const valid = new Set(['slash', 'hide'])
    const rec = deriveRecommendedActionsForTarget(actions, new Set(['slash', 'hide']), valid)
    expect(rec.map((a) => a.id)).toEqual(['slash'])
  })

  it('still recommends targeted attacks when valid', () => {
    const actions = [act({ id: 'mace', label: 'Mace' })]
    const rec = deriveRecommendedActionsForTarget(actions, new Set(['mace']), new Set(['mace']))
    expect(rec.map((a) => a.id)).toEqual(['mace'])
  })

  it('returns empty when no target-validation context', () => {
    expect(deriveRecommendedActionsForTarget([act({ id: 'x' })], undefined, undefined)).toEqual([])
  })
})
