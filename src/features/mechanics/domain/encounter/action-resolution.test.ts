import { describe, expect, it } from 'vitest'

import type { CombatActionDefinition } from './combat-actions.types'
import { getCombatantAvailableActions, resolveCombatAction } from './action-resolution'
import { createEncounterState } from './encounter-state'
import type { CombatantInstance } from './combatant.types'

function createCombatant(args: {
  instanceId: string
  label: string
  side: 'party' | 'enemies'
  initiativeModifier: number
  dexterityScore: number
  armorClass: number
  actions?: CombatActionDefinition[]
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
      armorClass: args.armorClass,
      maxHitPoints: 12,
      currentHitPoints: 12,
      initiativeModifier: args.initiativeModifier,
      dexterityScore: args.dexterityScore,
      speeds: { ground: 30 },
    },
    attacks: [],
    actions: args.actions ?? [],
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
  }
}

describe('resolveCombatAction', () => {
  it('hits a target, applies damage, spends the action, and keeps the same active turn', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'actor',
          label: 'Fighter',
          side: 'party',
          initiativeModifier: 5,
          dexterityScore: 16,
          armorClass: 16,
          actions: [
            {
              id: 'slash',
              label: 'Slash',
              kind: 'weapon_attack',
              cost: { action: true },
              resolutionMode: 'attack_roll',
              attackProfile: {
                attackBonus: 5,
                damage: '1d6 + 2',
                damageType: 'slashing',
              },
            },
          ],
        }),
        createCombatant({
          instanceId: 'target',
          label: 'Goblin',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 12,
          armorClass: 13,
        }),
      ],
      { rng: () => 0.1 }
    )

    const resolved = resolveCombatAction(
      state,
      { actorId: 'actor', targetId: 'target', actionId: 'slash' },
      {
        rng: () => 0.7, // d20 = 15, d6 = 5
      }
    )

    expect(resolved.activeCombatantId).toBe('actor')
    expect(resolved.combatantsById['target']?.stats.currentHitPoints).toBe(5)
    expect(resolved.combatantsById['actor']?.turnResources?.actionAvailable).toBe(false)
    expect(resolved.log.slice(-4).map((entry) => entry.type)).toEqual([
      'action_declared',
      'attack_hit',
      'damage_applied',
      'action_resolved',
    ])
  })

  it('misses without applying damage but still spends the action', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'actor',
          label: 'Fighter',
          side: 'party',
          initiativeModifier: 5,
          dexterityScore: 16,
          armorClass: 16,
          actions: [
            {
              id: 'slash',
              label: 'Slash',
              kind: 'weapon_attack',
              cost: { action: true },
              resolutionMode: 'attack_roll',
              attackProfile: {
                attackBonus: 2,
                damage: '7',
                damageType: 'slashing',
              },
            },
          ],
        }),
        createCombatant({
          instanceId: 'target',
          label: 'Goblin',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 12,
          armorClass: 20,
        }),
      ],
      { rng: () => 0.1 }
    )

    const resolved = resolveCombatAction(
      state,
      { actorId: 'actor', targetId: 'target', actionId: 'slash' },
      {
        rng: () => 0.2, // d20 = 5
      }
    )

    expect(resolved.combatantsById['target']?.stats.currentHitPoints).toBe(12)
    expect(resolved.combatantsById['actor']?.turnResources?.actionAvailable).toBe(false)
    expect(resolved.log.slice(-3).map((entry) => entry.type)).toEqual([
      'action_declared',
      'attack_missed',
      'action_resolved',
    ])
  })

  it('blocks repeated action use in the same turn', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'actor',
          label: 'Fighter',
          side: 'party',
          initiativeModifier: 5,
          dexterityScore: 16,
          armorClass: 16,
          actions: [
            {
              id: 'slash',
              label: 'Slash',
              kind: 'weapon_attack',
              cost: { action: true },
              resolutionMode: 'attack_roll',
              attackProfile: {
                attackBonus: 5,
                damage: '5',
                damageType: 'slashing',
              },
            },
          ],
        }),
        createCombatant({
          instanceId: 'target',
          label: 'Goblin',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 12,
          armorClass: 10,
        }),
      ],
      { rng: () => 0.1 }
    )

    const first = resolveCombatAction(
      state,
      { actorId: 'actor', targetId: 'target', actionId: 'slash' },
      { rng: () => 0.7 }
    )
    const second = resolveCombatAction(
      first,
      { actorId: 'actor', targetId: 'target', actionId: 'slash' },
      { rng: () => 0.7 }
    )

    expect(getCombatantAvailableActions(first, 'actor')).toEqual([])
    expect(second).toEqual(first)
  })

  it('logs placeholder spell actions without changing hit points', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'actor',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 5,
          dexterityScore: 16,
          armorClass: 12,
          actions: [
            {
              id: 'magic-missile-note',
              label: 'Magic Missile',
              kind: 'spell',
              cost: { action: true },
              resolutionMode: 'log_only',
              logText: 'Three glowing darts strike automatically.',
            },
          ],
        }),
        createCombatant({
          instanceId: 'target',
          label: 'Goblin',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 12,
          armorClass: 13,
        }),
      ],
      { rng: () => 0.1 }
    )

    const resolved = resolveCombatAction(state, {
      actorId: 'actor',
      targetId: 'target',
      actionId: 'magic-missile-note',
    })

    expect(resolved.combatantsById['target']?.stats.currentHitPoints).toBe(12)
    expect(resolved.combatantsById['actor']?.turnResources?.actionAvailable).toBe(false)
    expect(resolved.log.slice(-2).map((entry) => entry.type)).toEqual([
      'action_declared',
      'spell_logged',
    ])
  })

  it('spends only the bonus action for bonus-action log entries', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'actor',
          label: 'Goblin',
          side: 'enemies',
          initiativeModifier: 5,
          dexterityScore: 16,
          armorClass: 15,
          actions: [
            {
              id: 'nimble-escape',
              label: 'Nimble Escape',
              kind: 'monster_action',
              cost: { bonusAction: true },
              resolutionMode: 'log_only',
              logText: 'The goblin takes the Disengage or Hide action.',
            },
          ],
        }),
        createCombatant({
          instanceId: 'target',
          label: 'Fighter',
          side: 'party',
          initiativeModifier: 1,
          dexterityScore: 12,
          armorClass: 16,
        }),
      ],
      { rng: () => 0.9 }
    )

    const resolved = resolveCombatAction(state, {
      actorId: 'actor',
      actionId: 'nimble-escape',
      targetId: 'target',
    })

    expect(resolved.combatantsById['actor']?.turnResources).toEqual({
      actionAvailable: true,
      bonusActionAvailable: false,
      reactionAvailable: true,
      movementRemaining: 30,
      hasCastBonusActionSpell: false,
    })
    expect(resolved.log.slice(-2).map((entry) => entry.type)).toEqual([
      'action_declared',
      'action_resolved',
    ])
  })

  it('expands sequence actions using tracked part counts', () => {
    const state = createEncounterState(
      [
        {
          ...createCombatant({
            instanceId: 'hydra',
            label: 'Hydra',
            side: 'enemies',
            initiativeModifier: 5,
            dexterityScore: 12,
            armorClass: 15,
            actions: [
              {
                id: 'multiattack',
                label: 'Multiattack',
                kind: 'monster_action',
                cost: { action: true },
                resolutionMode: 'log_only',
                sequence: [
                  {
                    actionLabel: 'Bite',
                    count: 5,
                    countFromTrackedPart: 'head',
                  },
                ],
              },
              {
                id: 'bite',
                label: 'Bite',
                kind: 'monster_action',
                cost: { action: true },
                resolutionMode: 'attack_roll',
                attackProfile: {
                  attackBonus: 8,
                  damage: '1',
                  damageType: 'piercing',
                },
              },
            ],
          }),
          trackedParts: [
            {
              part: 'head',
              currentCount: 2,
              initialCount: 5,
              lostSinceLastTurn: 0,
              lossAppliedThisTurn: 0,
              damageTakenThisTurn: 0,
              damageTakenByTypeThisTurn: {},
              regrowthSuppressedByDamageTypes: [],
            },
          ],
        },
        createCombatant({
          instanceId: 'target',
          label: 'Fighter',
          side: 'party',
          initiativeModifier: 1,
          dexterityScore: 12,
          armorClass: 16,
        }),
      ],
      { rng: () => 0.9 }
    )

    const resolved = resolveCombatAction(
      state,
      {
        actorId: 'hydra',
        targetId: 'target',
        actionId: 'multiattack',
      },
      {
        rng: () => 0.7,
      },
    )

    expect(resolved.combatantsById['target']?.stats.currentHitPoints).toBe(10)
    expect(resolved.combatantsById['hydra']?.turnResources?.actionAvailable).toBe(false)
    expect(resolved.log.filter((entry) => entry.summary.includes('Hydra hits Fighter with Bite.'))).toHaveLength(2)
    expect(resolved.log[resolved.log.length - 1]?.summary).toBe('Multiattack resolves its action sequence.')
  })
})
