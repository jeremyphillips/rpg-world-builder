import { describe, expect, it } from 'vitest'

import {
  addConditionToCombatant,
  applyDamageToCombatant,
  createEncounterState,
} from '../state'
import type { CombatantInstance, CombatantTurnContext } from '../state'

function baseCombatant(
  id: string,
  side: 'party' | 'enemies',
  label: string,
  hp: number,
): CombatantInstance {
  return {
    instanceId: id,
    side,
    source: { kind: side === 'party' ? 'pc' : 'monster', sourceId: id, label },
    stats: {
      armorClass: 15,
      maxHitPoints: hp,
      currentHitPoints: hp,
      initiativeModifier: 0,
      dexterityScore: 10,
    },
    attacks: [],
    actions: [],
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
  }
}

describe('applyDamageToCombatant — charmed ends when ally of charmer damages target', () => {
  it('removes charmed when attacker is on the same side as the charmer (caster)', () => {
    const pc1 = baseCombatant('pc-1', 'party', 'Wizard', 20)
    const monster = baseCombatant('monster-1', 'enemies', 'Goblin', 10)
    const combatants = [pc1, monster]
    const state = createEncounterState(combatants, { rng: () => 0.5 })
    const withCharm = addConditionToCombatant(state, 'monster-1', 'charmed', {
      sourceInstanceId: 'pc-1',
    })
    expect(withCharm.combatantsById['monster-1']!.conditions.some((c) => c.label === 'charmed')).toBe(
      true,
    )

    const damaged = applyDamageToCombatant(withCharm, 'monster-1', 3, { actorId: 'pc-1' })
    expect(damaged.combatantsById['monster-1']!.conditions.some((c) => c.label === 'charmed')).toBe(
      false,
    )
    expect(
      damaged.log.some(
        (e) =>
          e.type === 'condition-removed' &&
          e.summary?.includes('charmed') &&
          e.summary?.includes('damaged by caster or ally'),
      ),
    ).toBe(true)
  })

  it('removes charmed when another ally damages the target', () => {
    const pc1 = baseCombatant('pc-1', 'party', 'Wizard', 20)
    const pc2 = baseCombatant('pc-2', 'party', 'Fighter', 20)
    const monster = baseCombatant('monster-1', 'enemies', 'Goblin', 10)
    const state = createEncounterState([pc1, pc2, monster], { rng: () => 0.5 })
    const withCharm = addConditionToCombatant(state, 'monster-1', 'charmed', {
      sourceInstanceId: 'pc-1',
    })
    const damaged = applyDamageToCombatant(withCharm, 'monster-1', 2, { actorId: 'pc-2' })
    expect(damaged.combatantsById['monster-1']!.conditions.some((c) => c.label === 'charmed')).toBe(
      false,
    )
  })

  it('does not remove charmed when the attacker is on the opposite side from the charmer', () => {
    const pc1 = baseCombatant('pc-1', 'party', 'Wizard', 20)
    const goblin = baseCombatant('monster-1', 'enemies', 'Goblin', 10)
    const orc = baseCombatant('monster-2', 'enemies', 'Orc', 15)
    const state = createEncounterState([pc1, goblin, orc], { rng: () => 0.5 })
    const withCharm = addConditionToCombatant(state, 'monster-1', 'charmed', {
      sourceInstanceId: 'pc-1',
    })
    const damaged = applyDamageToCombatant(withCharm, 'monster-1', 2, { actorId: 'monster-2' })
    expect(damaged.combatantsById['monster-1']!.conditions.some((c) => c.label === 'charmed')).toBe(
      true,
    )
  })
})

describe('applyDamageToCombatant — partial turnContext / tracked-part hydration', () => {
  it('does not throw when turnContext exists but omits damageTakenByType', () => {
    const target = baseCombatant('spawn-1', 'enemies', 'Spawn', 10)
    const actor = baseCombatant('pc-1', 'party', 'Hero', 20)
    const state = createEncounterState([actor, target], { rng: () => 0.5 })
    const withPartialCtx = {
      ...state,
      combatantsById: {
        ...state.combatantsById,
        'spawn-1': {
          ...state.combatantsById['spawn-1']!,
          // Simulates persisted or merged combatants missing nested fields (invalid vs CombatantTurnContext)
          turnContext: { totalDamageTaken: 0, movementSpentThisTurn: 0 } as unknown as CombatantTurnContext,
        },
      },
    }
    const next = applyDamageToCombatant(withPartialCtx, 'spawn-1', 2, {
      actorId: 'pc-1',
      damageType: 'piercing',
    })
    expect(next.combatantsById['spawn-1']!.stats.currentHitPoints).toBe(8)
    expect(next.combatantsById['spawn-1']!.turnContext?.damageTakenByType?.piercing).toBe(2)
  })
})
