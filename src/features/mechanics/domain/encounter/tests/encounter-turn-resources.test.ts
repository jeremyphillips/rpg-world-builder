import { describe, expect, it } from 'vitest'

import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import { advanceEncounterTurn, applyDamageToCombatant, createEncounterState } from '../state'
import type { CombatantInstance } from '../state'

function createCombatant(args: {
  instanceId: string
  label: string
  side: 'party' | 'enemies'
  initiativeModifier: number
  dexterityScore: number
  speed: number
  activeEffects?: Effect[]
}): CombatantInstance {
  return {
    instanceId: args.instanceId,
    side: args.side,
    source: {
      kind: args.side === 'party' ? 'pc' : 'monster',
      sourceId: args.instanceId,
      label: args.label,
    },
    stats: {
      armorClass: 15,
      maxHitPoints: 10,
      currentHitPoints: 10,
      initiativeModifier: args.initiativeModifier,
      dexterityScore: args.dexterityScore,
      speeds: { ground: args.speed },
    },
    attacks: [],
    activeEffects: args.activeEffects ?? [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
  }
}

describe('encounter turn resources', () => {
  it('seeds combatants with executable action state and turn resources', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'monster-1',
          label: 'Goblin',
          side: 'enemies',
          initiativeModifier: 2,
          dexterityScore: 14,
          speed: 30,
        }),
      ],
      { rng: () => 0.45 }
    )

    expect(state.combatantsById['monster-1']?.actions).toEqual([])
    expect(state.combatantsById['monster-1']?.turnResources).toEqual({
      actionAvailable: true,
      bonusActionAvailable: true,
      reactionAvailable: true,
      opportunityAttackReactionsRemaining: 0,
      movementRemaining: 30,
      hasCastBonusActionSpell: false,
    })
  })

  it('resets turn resources for the combatant whose turn starts', () => {
    const started = createEncounterState(
      [
        createCombatant({
          instanceId: 'pc-1',
          label: 'Cleric',
          side: 'party',
          initiativeModifier: 0,
          dexterityScore: 10,
          speed: 25,
        }),
        createCombatant({
          instanceId: 'monster-1',
          label: 'Goblin',
          side: 'enemies',
          initiativeModifier: 2,
          dexterityScore: 14,
          speed: 30,
        }),
      ],
      { rng: () => 0.45 }
    )

    const tamperedState = {
      ...started,
      combatantsById: {
        ...started.combatantsById,
        'pc-1': {
          ...started.combatantsById['pc-1'],
          turnResources: {
            actionAvailable: false,
            bonusActionAvailable: false,
            reactionAvailable: false,
            opportunityAttackReactionsRemaining: 0,
            movementRemaining: 0,
            hasCastBonusActionSpell: true,
          },
        },
      },
    }

    const next = advanceEncounterTurn(tamperedState)

    expect(next.activeCombatantId).toBe('pc-1')
    expect(next.combatantsById['pc-1']?.turnResources).toEqual({
      actionAvailable: true,
      bonusActionAvailable: true,
      reactionAvailable: true,
      opportunityAttackReactionsRemaining: 0,
      movementRemaining: 25,
      hasCastBonusActionSpell: false,
    })
  })

  it('derives opportunity-only extra reactions from tracked parts and keeps them synced', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'hydra',
          label: 'Hydra',
          side: 'enemies',
          initiativeModifier: 5,
          dexterityScore: 12,
          speed: 30,
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
            },
            {
              kind: 'extra-reaction',
              appliesTo: 'opportunity-attacks-only',
              count: {
                kind: 'per-part-beyond',
                part: 'head',
                baseline: 1,
              },
            },
          ],
        }),
      ],
      { rng: () => 0.4 }
    )

    expect(state.combatantsById['hydra']?.turnResources?.opportunityAttackReactionsRemaining).toBe(4)

    const damaged = applyDamageToCombatant(state, 'hydra', 25)
    expect(damaged.combatantsById['hydra']?.turnResources?.opportunityAttackReactionsRemaining).toBe(3)

    const next = advanceEncounterTurn(damaged)

    expect(next.combatantsById['hydra']?.turnResources?.opportunityAttackReactionsRemaining).toBe(3)
  })
})
