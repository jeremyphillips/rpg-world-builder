import { describe, expect, it } from 'vitest'

import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds'
import { getSystemMonster } from '@/features/mechanics/domain/rulesets/system/monsters'
import { applyDamageToCombatant } from './mutations'
import { createEncounterState } from '../runtime'
import type { CombatantInstance } from '../types'

function zombieCombatant(hp: number): CombatantInstance {
  return {
    instanceId: 'z1',
    side: 'enemies',
    source: { kind: 'monster', sourceId: 'zombie', label: 'Zombie' },
    creatureType: 'undead',
    stats: {
      armorClass: 8,
      maxHitPoints: 22,
      currentHitPoints: hp,
      initiativeModifier: -2,
      dexterityScore: 6,
      abilityScores: {
        strength: 13,
        dexterity: 6,
        constitution: 16,
        intelligence: 3,
        wisdom: 6,
        charisma: 5,
      },
      savingThrowModifiers: {
        constitution: 5,
      },
      speeds: { ground: 20 },
    },
    attacks: [],
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
  }
}

describe('Undead Fortitude (reduced-to-0-hp)', () => {
  const zombie = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'zombie')
  if (!zombie) throw new Error('zombie fixture missing')

  const monstersById = { zombie }

  it('sets HP to 1 when CON save succeeds (DC 5 + damage)', () => {
    const c = zombieCombatant(5)
    const state = createEncounterState([c], { rng: () => 0.5 })
    // CON +5, DC = 5+5 = 10 — high d20 roll via rng near 1
    const rng = () => 0.99
    const after = applyDamageToCombatant(state, 'z1', 5, {
      damageType: 'bludgeoning',
      monstersById,
      rng,
    })
    expect(after.combatantsById.z1?.stats.currentHitPoints).toBe(1)
    expect(after.log.some((e) => e.summary.includes('Undead Fortitude'))).toBe(true)
  })

  it('dies on failed save', () => {
    const c = zombieCombatant(4)
    const state = createEncounterState([c], { rng: () => 0.5 })
    const rng = () => 0.001
    const after = applyDamageToCombatant(state, 'z1', 4, {
      damageType: 'bludgeoning',
      monstersById,
      rng,
    })
    expect(after.combatantsById.z1?.stats.currentHitPoints).toBe(0)
  })

  it('skips save for radiant damage', () => {
    const c = zombieCombatant(5)
    const state = createEncounterState([c], { rng: () => 0.5 })
    const after = applyDamageToCombatant(state, 'z1', 5, {
      damageType: 'radiant',
      monstersById,
      rng: () => 0.99,
    })
    expect(after.combatantsById.z1?.stats.currentHitPoints).toBe(0)
    expect(after.log.some((e) => e.details?.includes('radiant'))).toBe(true)
  })

  it('skips save on critical hit', () => {
    const c = zombieCombatant(5)
    const state = createEncounterState([c], { rng: () => 0.5 })
    const after = applyDamageToCombatant(state, 'z1', 5, {
      damageType: 'bludgeoning',
      criticalHit: true,
      monstersById,
      rng: () => 0.99,
    })
    expect(after.combatantsById.z1?.stats.currentHitPoints).toBe(0)
  })
})
