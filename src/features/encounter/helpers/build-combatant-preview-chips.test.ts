import { describe, expect, it } from 'vitest'

import type { CombatantInstance } from '@/features/mechanics/domain/encounter'

import { collectPresentableEffects, enrichPresentableEffects } from '../domain/effects/presentable-effects'
import { buildCombatantPreviewChips } from './build-combatant-preview-chips'

function minimalCombatant(overrides: Partial<CombatantInstance> = {}): CombatantInstance {
  return {
    instanceId: 'test-1',
    side: 'party',
    source: { kind: 'pc', sourceId: 'c1', label: 'Test' },
    stats: {
      armorClass: 14,
      maxHitPoints: 20,
      currentHitPoints: 20,
      initiativeModifier: 2,
    },
    attacks: [],
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
    ...overrides,
  }
}

describe('buildCombatantPreviewChips', () => {
  it('condition chip label matches enriched presentable label for the same semantic key', () => {
    const combatant = minimalCombatant({
      conditions: [{ id: 'prone', label: 'prone' }],
    })
    const chips = buildCombatantPreviewChips(combatant)
    const enriched = enrichPresentableEffects(collectPresentableEffects(combatant))
    const proneChip = chips.find((c) => c.id === 'prone')
    const proneEffect = enriched.find((e) => e.key === 'prone')
    expect(proneChip?.label).toBe('Prone')
    expect(proneEffect?.label).toBe('Prone')
    expect(proneChip?.label).toBe(proneEffect?.label)
  })

  it('includes Defeated chip from participation_defeated when HP is 0', () => {
    const combatant = minimalCombatant({
      stats: { armorClass: 10, maxHitPoints: 10, currentHitPoints: 0, initiativeModifier: 0 },
    })
    const chips = buildCombatantPreviewChips(combatant)
    const defeated = chips.find((c) => c.id === 'participation-defeated')
    expect(defeated?.label).toBe('Defeated')
  })

  it('uses canonical label when raw marker label is wrong casing', () => {
    const combatant = minimalCombatant({
      conditions: [{ id: 'incapacitated', label: 'bad' }],
    })
    const chips = buildCombatantPreviewChips(combatant)
    expect(chips.find((c) => c.id === 'incapacitated')?.label).toBe('Incapacitated')
  })
})
