import { describe, expect, it } from 'vitest'

import {
  collectPresentableEffects,
  enrichPresentableEffects,
  getUserFacingEffectLabel,
  groupBySection,
  sortByPriority,
} from './presentable-effects'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter'

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

describe('collectPresentableEffects', () => {
  it('returns empty array for combatant with no state', () => {
    const combatant = minimalCombatant()
    expect(collectPresentableEffects(combatant)).toEqual([])
  })

  it('adds bloodied when HP <= 50%', () => {
    const combatant = minimalCombatant({
      stats: {
        armorClass: 14,
        maxHitPoints: 20,
        currentHitPoints: 8,
        initiativeModifier: 2,
      },
    })
    const effects = collectPresentableEffects(combatant)
    expect(effects).toContainEqual(
      expect.objectContaining({
        kind: 'effect',
        key: 'bloodied',
        label: 'Bloodied',
      }),
    )
  })

  it('does not add bloodied when HP > 50%', () => {
    const combatant = minimalCombatant({
      stats: {
        armorClass: 14,
        maxHitPoints: 20,
        currentHitPoints: 15,
        initiativeModifier: 2,
      },
    })
    const effects = collectPresentableEffects(combatant)
    expect(effects.filter((e) => e.key === 'bloodied')).toHaveLength(0)
  })

  it('includes conditions', () => {
    const combatant = minimalCombatant({
      conditions: [{ id: 'prone', label: 'prone' }],
    })
    const effects = collectPresentableEffects(combatant)
    expect(effects).toContainEqual(
      expect.objectContaining({
        kind: 'condition',
        key: 'prone',
        label: 'prone',
      }),
    )
  })

  it('includes states', () => {
    const combatant = minimalCombatant({
      states: [{ id: 'concentrating', label: 'concentrating' }],
    })
    const effects = collectPresentableEffects(combatant)
    expect(effects).toContainEqual(
      expect.objectContaining({
        kind: 'effect',
        key: 'concentrating',
        label: 'concentrating',
      }),
    )
  })

  it('includes turn hooks with boundary', () => {
    const combatant = minimalCombatant({
      turnHooks: [
        {
          id: 'hook-1',
          label: 'Rampage',
          boundary: 'start',
          effects: [],
        },
      ],
    })
    const effects = collectPresentableEffects(combatant)
    expect(effects).toContainEqual(
      expect.objectContaining({
        kind: 'trigger',
        key: 'hook-1',
        label: 'Rampage',
        boundary: 'start',
      }),
    )
  })
})

describe('enrichPresentableEffects', () => {
  it('adds presentation from map and canonical label (raw marker label ignored)', () => {
    const combatant = minimalCombatant({
      conditions: [{ id: 'prone', label: 'prone' }],
    })
    const presentable = collectPresentableEffects(combatant)
    const enriched = enrichPresentableEffects(presentable)
    expect(enriched[0].presentation).toMatchObject({
      label: 'Prone',
      tone: 'warning',
      defaultSection: 'critical-now',
    })
    expect(enriched[0].label).toBe('Prone')
    expect(enriched[0].usedFallbackPresentation).toBe(false)
    expect(enriched[0].presentationTier).toBe('core')
    expect(getUserFacingEffectLabel(enriched[0])).toBe('Prone')
  })

  it('maps exhaustion as core (immunity-only condition id)', () => {
    const combatant = minimalCombatant({
      conditions: [{ id: 'exhaustion', label: 'exhaustion' }],
    })
    const enriched = enrichPresentableEffects(collectPresentableEffects(combatant))[0]!
    expect(enriched.label).toBe('Exhaustion')
    expect(enriched.presentationTier).toBe('core')
    expect(enriched.usedFallbackPresentation).toBe(false)
  })

  it('canonicalizes label when raw marker text is stale but id matches map', () => {
    const combatant = minimalCombatant({
      conditions: [{ id: 'incapacitated', label: 'INCORRECT_RAW' }],
    })
    const presentable = collectPresentableEffects(combatant)
    const enriched = enrichPresentableEffects(presentable)
    expect(enriched[0].label).toBe('Incapacitated')
    expect(enriched[0].usedFallbackPresentation).toBe(false)
    expect(enriched[0].presentationTier).toBe('core')
  })

  it('uses fallback for unknown keys', () => {
    const combatant = minimalCombatant({
      states: [{ id: 'custom-state', label: 'custom-state' }],
    })
    const presentable = collectPresentableEffects(combatant)
    const enriched = enrichPresentableEffects(presentable)
    expect(enriched[0].presentation).toMatchObject({
      label: 'Custom State',
      tone: 'neutral',
      defaultSection: 'restrictions',
    })
    expect(enriched[0].usedFallbackPresentation).toBe(true)
    expect(enriched[0].presentationTier).toBe('fallback')
  })
})

describe('sortByPriority', () => {
  it('returns empty for empty input', () => {
    expect(sortByPriority([])).toEqual([])
  })

  it('sorts by section then priority', () => {
    const combatant = minimalCombatant({
      conditions: [{ id: 'prone', label: 'prone' }],
      states: [{ id: 'concentrating', label: 'concentrating' }],
    })
    const presentable = collectPresentableEffects(combatant)
    const enriched = enrichPresentableEffects(presentable)
    const sorted = sortByPriority(enriched)
    expect(sorted.length).toBeGreaterThanOrEqual(2)
    const sections = sorted.map((e) => e.presentation.defaultSection)
    expect(sections).toEqual([...sections].sort())
  })
})

describe('groupBySection', () => {
  it('returns all sections with empty arrays when no effects', () => {
    const combatant = minimalCombatant()
    const presentable = collectPresentableEffects(combatant)
    const enriched = enrichPresentableEffects(presentable)
    const grouped = groupBySection(enriched)
    expect(Object.keys(grouped)).toHaveLength(5)
    expect(grouped['critical-now']).toEqual([])
    expect(grouped['system-details']).toEqual([])
  })
})
