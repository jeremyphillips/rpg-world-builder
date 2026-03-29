import { describe, expect, it } from 'vitest'

import type { CombatantInstance } from '@/features/mechanics/domain/encounter'

import { formatEncounterHeaderSensesLine } from './formatEncounterHeaderSenses'

function baseCombatant(overrides: Partial<CombatantInstance> = {}): CombatantInstance {
  return {
    instanceId: 'x',
    side: 'party',
    source: { kind: 'pc', sourceId: 'x', label: 'Hero' },
    stats: {
      armorClass: 14,
      maxHitPoints: 20,
      currentHitPoints: 20,
      initiativeModifier: 0,
    },
    attacks: [],
    actions: [],
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
    ...overrides,
  }
}

describe('formatEncounterHeaderSensesLine', () => {
  it('returns null when no blindsight or darkvision', () => {
    expect(formatEncounterHeaderSensesLine(baseCombatant())).toBeNull()
  })

  it('formats darkvision only', () => {
    const c = baseCombatant({
      senses: { special: [{ type: 'darkvision', range: 60 }] },
    })
    expect(formatEncounterHeaderSensesLine(c)).toBe('Senses: Darkvision 60 ft')
  })

  it('formats blindsight then darkvision when both present', () => {
    const c = baseCombatant({
      senses: {
        special: [
          { type: 'darkvision', range: 120 },
          { type: 'blindsight', range: 60 },
        ],
      },
    })
    expect(formatEncounterHeaderSensesLine(c)).toBe('Senses: Blindsight 60 ft · Darkvision 120 ft')
  })

  it('uses max range when multiple entries of the same sense', () => {
    const c = baseCombatant({
      senses: {
        special: [
          { type: 'darkvision', range: 60 },
          { type: 'darkvision', range: 120 },
        ],
      },
    })
    expect(formatEncounterHeaderSensesLine(c)).toBe('Senses: Darkvision 120 ft')
  })

  it('includes darkvision from skillRuntime when senses omit it (same as perception derivation)', () => {
    const c = baseCombatant({
      stats: {
        armorClass: 14,
        maxHitPoints: 20,
        currentHitPoints: 20,
        initiativeModifier: 0,
        skillRuntime: { darkvisionRangeFt: 60 },
      },
    })
    expect(formatEncounterHeaderSensesLine(c)).toBe('Senses: Darkvision 60 ft')
  })
})
