import { describe, expect, it } from 'vitest'

import { applyDamageToCombatant, advanceEncounterTurn, createEncounterState } from '../state'
import type { CombatantInstance } from '../state'

function createHydra(): CombatantInstance {
  return {
    instanceId: 'hydra',
    side: 'enemies',
    source: {
      kind: 'monster',
      sourceId: 'hydra',
      label: 'Hydra',
    },
    stats: {
      armorClass: 15,
      maxHitPoints: 50,
      currentHitPoints: 50,
      initiativeModifier: 1,
      dexterityScore: 12,
      speeds: { ground: 30 },
    },
    attacks: [],
    actions: [],
    activeEffects: [
      {
        kind: 'tracked-part',
        part: 'head',
        initialCount: 5,
        loss: {
          trigger: 'damage-taken-in-single-turn',
          minDamage: 25,
          count: 1,
        },
        deathWhenCountReaches: 0,
        regrowth: {
          trigger: 'turn-end',
          requiresLivingPart: true,
          countPerPartLostSinceLastTurn: 2,
          suppressedByDamageTypes: ['fire'],
          healHitPoints: 20,
        },
      },
    ],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
  }
}

describe('tracked monster parts', () => {
  it('severs and regrows hydra heads at turn end when not suppressed', () => {
    const started = createEncounterState([createHydra()], {
      rng: () => 0.4,
    })

    const damaged = applyDamageToCombatant(started, 'hydra', 25, {
      damageType: 'slashing',
    })

    expect(damaged.combatantsById['hydra']?.trackedParts?.[0]).toEqual(
      expect.objectContaining({
        part: 'head',
        currentCount: 4,
        lostSinceLastTurn: 1,
      }),
    )

    const nextTurn = advanceEncounterTurn(damaged)

    expect(nextTurn.combatantsById['hydra']?.trackedParts?.[0]).toEqual(
      expect.objectContaining({
        part: 'head',
        currentCount: 6,
        lostSinceLastTurn: 0,
      }),
    )
    expect(nextTurn.combatantsById['hydra']?.stats.currentHitPoints).toBe(45)
  })

  it('suppresses hydra head regrowth after fire damage', () => {
    const started = createEncounterState([createHydra()], {
      rng: () => 0.4,
    })

    const damaged = applyDamageToCombatant(started, 'hydra', 25, {
      damageType: 'fire',
    })
    const nextTurn = advanceEncounterTurn(damaged)

    expect(nextTurn.combatantsById['hydra']?.trackedParts?.[0]).toEqual(
      expect.objectContaining({
        part: 'head',
        currentCount: 4,
        lostSinceLastTurn: 0,
      }),
    )
    expect(nextTurn.combatantsById['hydra']?.stats.currentHitPoints).toBe(25)
  })
})
