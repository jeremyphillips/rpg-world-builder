import { describe, expect, it } from 'vitest'

import type { CombatantInstance } from '../types/combatant.types'
import { applyDamageToCombatant, applyHealingToCombatant } from '../mutations/damage-mutations'
import { createEncounterState } from '../runtime'
import {
  canTargetAsDeadCreature,
  isActiveCombatant,
  isDeadCombatant,
  isDefeatedCombatant,
} from './combatant-participation'

function baseCombatant(overrides: Partial<CombatantInstance>): CombatantInstance {
  return {
    instanceId: 'target',
    side: 'party',
    source: { kind: 'pc', sourceId: 'p', label: 'Target' },
    stats: {
      armorClass: 10,
      maxHitPoints: 10,
      currentHitPoints: 10,
      initiativeModifier: 0,
      dexterityScore: 10,
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

describe('participation + death fields through damage and healing', () => {
  it('lethal damage records death (diedAtRound + remains) — not merely HP ≤ 0 without record', () => {
    const state = createEncounterState([baseCombatant({ instanceId: 'v' })], { rng: () => 0.5 })
    const after = applyDamageToCombatant(state, 'v', 10)
    const c = after.combatantsById['v']!
    expect(c.stats.currentHitPoints).toBe(0)
    expect(c.diedAtRound).toBeDefined()
    expect(c.remains).toBe('corpse')
    expect(isDeadCombatant(c)).toBe(true)
    expect(isDefeatedCombatant(c)).toBe(true)
    expect(canTargetAsDeadCreature(c)).toBe(true)
  })

  it('revival (heal from 0 to > 0) clears death record and ends dead-creature targetability', () => {
    const state = createEncounterState([baseCombatant({ instanceId: 'v' })], { rng: () => 0.5 })
    const dead = applyDamageToCombatant(state, 'v', 10)
    const revived = applyHealingToCombatant(dead, 'v', 5)
    const c = revived.combatantsById['v']!
    expect(c.stats.currentHitPoints).toBe(5)
    expect(c.diedAtRound).toBeUndefined()
    expect(c.remains).toBeUndefined()
    expect(isActiveCombatant(c)).toBe(true)
    expect(isDeadCombatant(c)).toBe(false)
    expect(isDefeatedCombatant(c)).toBe(false)
    expect(canTargetAsDeadCreature(c)).toBe(false)
  })

  it('applyHealingToCombatant with amount 0 is a no-op (death fields unchanged)', () => {
    const state = createEncounterState([baseCombatant({ instanceId: 'v' })], { rng: () => 0.5 })
    const dead = applyDamageToCombatant(state, 'v', 10)
    const same = applyHealingToCombatant(dead, 'v', 0)
    expect(same).toBe(dead)
    expect(same.combatantsById['v']!.diedAtRound).toBeDefined()
  })
})
