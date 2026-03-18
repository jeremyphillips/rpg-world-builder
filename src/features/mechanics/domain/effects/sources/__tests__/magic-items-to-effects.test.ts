import { describe, expect, it } from 'vitest'
import {
  getMagicItemCandidateEffects,
  selectActiveMagicItemEffects,
} from '../magic-items-to-effects'

describe('magic item effects', () => {
  it('uses canonical modifier effects from the catalog directly', () => {
    expect(getMagicItemCandidateEffects(['ring-of-protection'])).toEqual([
      {
        kind: 'modifier',
        target: 'armor_class',
        mode: 'add',
        value: 1,
        source: 'magic_item:ring-of-protection',
      },
      {
        kind: 'modifier',
        target: 'saving_throw',
        mode: 'add',
        value: 1,
        source: 'magic_item:ring-of-protection',
      },
    ])
  })

  it('filters attunement-gated item effects by active loadout', () => {
    const candidates = getMagicItemCandidateEffects(['ring-of-protection', 'bag-of-holding'])

    expect(
      selectActiveMagicItemEffects(candidates, {
        equippedIds: ['ring-of-protection', 'bag-of-holding'],
        attunedIds: [],
      }),
    ).toEqual([
      {
        kind: 'note',
        text: 'Inventory rule: capacity 500 lb / 64 cu ft; fixed weight 15 lb.',
        source: 'magic_item:bag-of-holding',
      },
    ])
  })
})
