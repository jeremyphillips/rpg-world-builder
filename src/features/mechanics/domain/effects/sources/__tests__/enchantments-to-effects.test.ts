import { describe, expect, it } from 'vitest'
import { getEnchantmentCandidateEffects } from '../enchantments-to-effects'
import type { ResolvedEquipmentLoadout } from '../equipment-to-effects'

function buildResolvedLoadout(
  overrides: Partial<ResolvedEquipmentLoadout>,
): ResolvedEquipmentLoadout {
  return {
    armor: {},
    shield: {},
    mainHand: {},
    offHand: {},
    ...overrides,
  }
}

describe('getEnchantmentCandidateEffects', () => {
  it('returns canonical modifier effects for active enchantment templates', () => {
    const resolved = buildResolvedLoadout({
      mainHand: {
        baseId: 'longsword',
        enhancementTemplateId: 'enhancement-plus-1',
      },
      armor: {
        baseId: 'plate',
        enhancementTemplateId: 'enhancement-plus-2',
      },
    })

    expect(getEnchantmentCandidateEffects({ resolved })).toEqual([
      { kind: 'modifier', target: 'attack_roll', mode: 'add', value: 1, source: 'magic' },
      { kind: 'modifier', target: 'damage', mode: 'add', value: 1, source: 'magic' },
      { kind: 'modifier', target: 'armor_class', mode: 'add', value: 2, source: 'magic_armor' },
    ])
  })
})
