import { describe, expect, it } from 'vitest'

import {
  addConditionToCombatant,
  addStateToCombatant,
  advanceEncounterTurn,
  applyDamageToCombatant,
  applyHealingToCombatant,
  createEncounterState,
  formatMarkerLabel,
  formatRuntimeEffectLabel,
  removeConditionFromCombatant,
  removeStateFromCombatant,
  triggerManualHook,
} from '../state'
import { rollInitiative } from '../resolution'
import type { CombatantInstance } from '../state'

describe('rollInitiative', () => {
  it('sorts by total, then modifier, then dexterity, then name', () => {
    const rolls = rollInitiative(
      [
        { instanceId: 'goblin-2', label: 'Goblin B', initiativeModifier: 2, dexterityScore: 14 },
        { instanceId: 'goblin-1', label: 'Goblin A', initiativeModifier: 2, dexterityScore: 14 },
        { instanceId: 'rogue', label: 'Rogue', initiativeModifier: 4, dexterityScore: 18 },
      ],
      {
        rng: () => 0.45, // 10 on a d20
      },
    )

    expect(rolls.map((roll) => roll.combatantId)).toEqual(['rogue', 'goblin-1', 'goblin-2'])
    expect(rolls.map((roll) => roll.total)).toEqual([14, 12, 12])
  })

  it('creates encounter state with the first initiative result active', () => {
    const combatants: CombatantInstance[] = [
      {
        instanceId: 'pc-1',
        side: 'party',
        source: { kind: 'pc', sourceId: 'pc-1', label: 'Cleric' },
        stats: { armorClass: 18, maxHitPoints: 20, currentHitPoints: 20, initiativeModifier: 0, dexterityScore: 10 },
        attacks: [],
        activeEffects: [],
        runtimeEffects: [],
        turnHooks: [],
        conditions: [],
        states: [],
      },
      {
        instanceId: 'monster-1',
        side: 'enemies',
        source: { kind: 'monster', sourceId: 'goblin', label: 'Goblin' },
        stats: { armorClass: 15, maxHitPoints: 7, currentHitPoints: 7, initiativeModifier: 2, dexterityScore: 14 },
        attacks: [],
        activeEffects: [],
        runtimeEffects: [],
        turnHooks: [],
        conditions: [],
        states: [],
      },
    ]

    const state = createEncounterState(combatants, {
      rng: () => 0.45,
    })

    expect(state.initiativeOrder).toEqual(['monster-1', 'pc-1'])
    expect(state.activeCombatantId).toBe('monster-1')
    expect(state.roundNumber).toBe(1)
    expect(state.partyCombatantIds).toEqual(['pc-1'])
    expect(state.enemyCombatantIds).toEqual(['monster-1'])
    expect(state.log.map((entry) => entry.type)).toEqual(['encounter-started', 'turn-started'])
  })

  it('advances turn order and starts a new round when initiative wraps', () => {
    const combatants: CombatantInstance[] = [
      {
        instanceId: 'pc-1',
        side: 'party',
        source: { kind: 'pc', sourceId: 'pc-1', label: 'Cleric' },
        stats: { armorClass: 18, maxHitPoints: 20, currentHitPoints: 20, initiativeModifier: 0, dexterityScore: 10 },
        attacks: [],
        activeEffects: [],
        runtimeEffects: [],
        turnHooks: [],
        conditions: [],
        states: [],
      },
      {
        instanceId: 'monster-1',
        side: 'enemies',
        source: { kind: 'monster', sourceId: 'goblin', label: 'Goblin' },
        stats: { armorClass: 15, maxHitPoints: 7, currentHitPoints: 7, initiativeModifier: 2, dexterityScore: 14 },
        attacks: [],
        activeEffects: [],
        runtimeEffects: [],
        turnHooks: [],
        conditions: [],
        states: [],
      },
    ]

    const started = createEncounterState(combatants, {
      rng: () => 0.45,
    })
    const secondTurn = advanceEncounterTurn(started)
    const wrappedTurn = advanceEncounterTurn(secondTurn)

    expect(secondTurn.activeCombatantId).toBe('pc-1')
    expect(secondTurn.roundNumber).toBe(1)
    expect(secondTurn.log.slice(-2).map((entry) => entry.type)).toEqual(['turn-ended', 'turn-started'])

    expect(wrappedTurn.activeCombatantId).toBe('monster-1')
    expect(wrappedTurn.roundNumber).toBe(2)
    expect(wrappedTurn.log.slice(-3).map((entry) => entry.type)).toEqual([
      'turn-ended',
      'round-started',
      'turn-started',
    ])
  })

  it('applies damage, healing, and runtime markers with log output', () => {
    const combatants: CombatantInstance[] = [
      {
        instanceId: 'pc-1',
        side: 'party',
        source: { kind: 'pc', sourceId: 'pc-1', label: 'Cleric' },
        stats: { armorClass: 18, maxHitPoints: 20, currentHitPoints: 20, initiativeModifier: 0, dexterityScore: 10 },
        attacks: [],
        activeEffects: [],
        runtimeEffects: [],
        turnHooks: [],
        conditions: [],
        states: [],
      },
    ]

    const started = createEncounterState(combatants, {
      rng: () => 0.45,
    })
    const damaged = applyDamageToCombatant(started, 'pc-1', 7)
    const healed = applyHealingToCombatant(damaged, 'pc-1', 3)
    const conditioned = addConditionToCombatant(healed, 'pc-1', 'poisoned')
    const stated = addStateToCombatant(conditioned, 'pc-1', 'concentrating')
    const conditionRemoved = removeConditionFromCombatant(stated, 'pc-1', 'poisoned')
    const stateRemoved = removeStateFromCombatant(conditionRemoved, 'pc-1', 'concentrating')

    expect(damaged.combatantsById['pc-1'].stats.currentHitPoints).toBe(13)
    expect(healed.combatantsById['pc-1'].stats.currentHitPoints).toBe(16)
    expect(stated.combatantsById['pc-1'].conditions.map((entry) => entry.label)).toEqual(['poisoned'])
    expect(stated.combatantsById['pc-1'].states.map((entry) => entry.label)).toEqual(['concentrating'])
    expect(stateRemoved.combatantsById['pc-1'].conditions).toEqual([])
    expect(stateRemoved.combatantsById['pc-1'].states).toEqual([])
    expect(stateRemoved.log.slice(-6).map((entry) => entry.type)).toEqual([
      'damage-applied',
      'healing-applied',
      'condition-applied',
      'state-applied',
      'condition-removed',
      'state-removed',
    ])
  })

  it('expires timed markers on the configured turn boundary', () => {
    const combatants: CombatantInstance[] = [
      {
        instanceId: 'pc-1',
        side: 'party',
        source: { kind: 'pc', sourceId: 'pc-1', label: 'Cleric' },
        stats: { armorClass: 18, maxHitPoints: 20, currentHitPoints: 20, initiativeModifier: 0, dexterityScore: 10 },
        attacks: [],
        activeEffects: [],
        runtimeEffects: [],
        turnHooks: [],
        conditions: [],
        states: [],
      },
      {
        instanceId: 'monster-1',
        side: 'enemies',
        source: { kind: 'monster', sourceId: 'goblin', label: 'Goblin' },
        stats: { armorClass: 15, maxHitPoints: 7, currentHitPoints: 7, initiativeModifier: 2, dexterityScore: 14 },
        attacks: [],
        activeEffects: [],
        runtimeEffects: [],
        turnHooks: [],
        conditions: [],
        states: [],
      },
    ]

    const started = createEncounterState(combatants, {
      rng: () => 0.45,
    })
    const withStartMarker = addConditionToCombatant(started, 'pc-1', 'blessed', {
      durationTurns: 1,
      tickOn: 'start',
    })
    const withBothMarkers = addStateToCombatant(withStartMarker, 'monster-1', 'charging', {
      durationTurns: 1,
      tickOn: 'end',
    })
    const secondTurn = advanceEncounterTurn(withBothMarkers)
    const wrappedTurn = advanceEncounterTurn(secondTurn)

    expect(formatMarkerLabel(withBothMarkers.combatantsById['pc-1'].conditions[0]!)).toBe(
      'blessed (1 turn start)',
    )
    expect(secondTurn.combatantsById['monster-1'].states).toEqual([])
    expect(secondTurn.combatantsById['pc-1'].conditions).toEqual([])
    expect(secondTurn.log.slice(-4).map((entry) => entry.type)).toEqual([
      'turn-ended',
      'state-removed',
      'turn-started',
      'condition-removed',
    ])
    expect(wrappedTurn.log.slice(-3).map((entry) => entry.type)).toEqual([
      'turn-ended',
      'round-started',
      'turn-started',
    ])
  })

  it('seeds timed runtime effects from canonical effect durations and expires them', () => {
    const combatants: CombatantInstance[] = [
      {
        instanceId: 'pc-1',
        side: 'party',
        source: { kind: 'pc', sourceId: 'pc-1', label: 'Cleric' },
        stats: { armorClass: 18, maxHitPoints: 20, currentHitPoints: 20, initiativeModifier: 0, dexterityScore: 10 },
        attacks: [],
        activeEffects: [
          {
            kind: 'condition',
            conditionId: 'frightened',
            duration: {
              kind: 'until-turn-boundary',
              subject: 'self',
              turn: 'next',
              boundary: 'end',
            },
          },
        ],
        runtimeEffects: [],
        turnHooks: [],
        conditions: [],
        states: [],
      },
      {
        instanceId: 'monster-1',
        side: 'enemies',
        source: { kind: 'monster', sourceId: 'goblin', label: 'Goblin' },
        stats: { armorClass: 15, maxHitPoints: 7, currentHitPoints: 7, initiativeModifier: 2, dexterityScore: 14 },
        attacks: [],
        activeEffects: [],
        runtimeEffects: [],
        turnHooks: [],
        conditions: [],
        states: [],
      },
    ]

    const started = createEncounterState(combatants, {
      rng: () => 0.45,
    })
    const secondTurn = advanceEncounterTurn(started)
    const wrappedTurn = advanceEncounterTurn(secondTurn)

    expect(started.combatantsById['pc-1'].runtimeEffects).toHaveLength(1)
    expect(formatRuntimeEffectLabel(started.combatantsById['pc-1'].runtimeEffects[0]!)).toBe(
      'Condition: frightened (1 turn end)',
    )
    expect(secondTurn.combatantsById['pc-1'].runtimeEffects).toHaveLength(1)
    expect(wrappedTurn.combatantsById['pc-1'].runtimeEffects).toHaveLength(0)
    expect(wrappedTurn.log.some((entry) => entry.type === 'effect-expired')).toBe(true)
  })

  it('fires start-of-turn hooks and applies simple hit point effects', () => {
    const combatants: CombatantInstance[] = [
      {
        instanceId: 'pc-1',
        side: 'party',
        source: { kind: 'pc', sourceId: 'pc-1', label: 'Cleric' },
        stats: { armorClass: 18, maxHitPoints: 20, currentHitPoints: 20, initiativeModifier: 0, dexterityScore: 10 },
        attacks: [],
        activeEffects: [],
        runtimeEffects: [],
        turnHooks: [],
        conditions: [],
        states: [],
      },
      {
        instanceId: 'monster-1',
        side: 'enemies',
        source: { kind: 'monster', sourceId: 'troll', label: 'Troll' },
        stats: { armorClass: 15, maxHitPoints: 30, currentHitPoints: 20, initiativeModifier: 2, dexterityScore: 14 },
        attacks: [],
        activeEffects: [],
        runtimeEffects: [],
        turnHooks: [
          {
            id: 'regen',
            label: 'Regeneration',
            boundary: 'start',
            effects: [{ kind: 'hit-points', mode: 'heal', value: 15 }],
          },
        ],
        conditions: [],
        states: [],
      },
    ]

    const started = createEncounterState(combatants, {
      rng: () => 0.45,
    })

    expect(started.combatantsById['monster-1'].stats.currentHitPoints).toBe(30)
    expect(started.log.slice(-2).map((entry) => entry.type)).toEqual([
      'hook-triggered',
      'healing-applied',
    ])
  })

  it('applies condition and state payloads from hooks using effect durations', () => {
    const combatants: CombatantInstance[] = [
      {
        instanceId: 'pc-1',
        side: 'party',
        source: { kind: 'pc', sourceId: 'pc-1', label: 'Cleric' },
        stats: { armorClass: 18, maxHitPoints: 20, currentHitPoints: 20, initiativeModifier: 3, dexterityScore: 16 },
        attacks: [],
        activeEffects: [],
        runtimeEffects: [],
        turnHooks: [
          {
            id: 'start-buff',
            label: 'Battle Focus',
            boundary: 'start',
            effects: [
              {
                kind: 'condition',
                conditionId: 'invisible',
                duration: {
                  kind: 'until-turn-boundary',
                  subject: 'self',
                  turn: 'next',
                  boundary: 'end',
                },
              },
              {
                kind: 'state',
                stateId: 'battle-focus',
                duration: {
                  kind: 'fixed',
                  value: 2,
                  unit: 'turn',
                },
              },
            ],
          },
        ],
        conditions: [],
        states: [],
      },
      {
        instanceId: 'monster-1',
        side: 'enemies',
        source: { kind: 'monster', sourceId: 'goblin', label: 'Goblin' },
        stats: { armorClass: 15, maxHitPoints: 7, currentHitPoints: 7, initiativeModifier: 1, dexterityScore: 12 },
        attacks: [],
        activeEffects: [],
        runtimeEffects: [],
        turnHooks: [],
        conditions: [],
        states: [],
      },
    ]

    const started = createEncounterState(combatants, {
      rng: () => 0.45,
    })
    const secondTurn = advanceEncounterTurn(started)
    const wrappedTurn = advanceEncounterTurn(secondTurn)

    expect(started.combatantsById['pc-1'].conditions).toHaveLength(1)
    expect(formatMarkerLabel(started.combatantsById['pc-1'].conditions[0]!)).toBe(
      'invisible (1 turn end)',
    )
    expect(formatMarkerLabel(started.combatantsById['pc-1'].states[0]!)).toBe(
      'battle-focus (2 turns end)',
    )
    expect(secondTurn.combatantsById['pc-1'].conditions).toEqual([])
    expect(secondTurn.combatantsById['pc-1'].states[0]?.duration?.remainingTurns).toBe(1)
    expect(wrappedTurn.combatantsById['pc-1'].conditions).toHaveLength(1)
  })

  it('suppresses matching turn hooks after typed damage', () => {
    const combatants: CombatantInstance[] = [
      {
        instanceId: 'pc-1',
        side: 'party',
        source: { kind: 'pc', sourceId: 'pc-1', label: 'Cleric' },
        stats: { armorClass: 18, maxHitPoints: 20, currentHitPoints: 20, initiativeModifier: 3, dexterityScore: 16 },
        attacks: [],
        activeEffects: [],
        runtimeEffects: [],
        turnHooks: [],
        conditions: [],
        states: [],
      },
      {
        instanceId: 'monster-1',
        side: 'enemies',
        source: { kind: 'monster', sourceId: 'troll', label: 'Troll' },
        stats: { armorClass: 15, maxHitPoints: 30, currentHitPoints: 20, initiativeModifier: 1, dexterityScore: 12 },
        attacks: [],
        activeEffects: [],
        runtimeEffects: [],
        turnHooks: [
          {
            id: 'regen',
            label: 'Regeneration',
            boundary: 'start',
            effects: [{ kind: 'hit-points', mode: 'heal', value: 15 }],
            suppression: {
              damageTypes: ['fire', 'acid'],
              duration: {
                remainingTurns: 1,
                tickOn: 'end',
              },
            },
          },
        ],
        conditions: [],
        states: [],
      },
    ]

    const started = createEncounterState(combatants, {
      rng: () => 0.45,
    })
    const damaged = applyDamageToCombatant(started, 'monster-1', 5, {
      damageType: 'fire',
    })
    const nextTurn = advanceEncounterTurn(damaged)

    expect(damaged.combatantsById['monster-1'].suppressedHooks).toHaveLength(1)
    expect(nextTurn.combatantsById['monster-1'].stats.currentHitPoints).toBe(15)
    expect(nextTurn.log.some((entry) => entry.summary.includes('hook is suppressed: Regeneration'))).toBe(true)
  })

  it('only fires hooks when monster requirements are met', () => {
    const combatants: CombatantInstance[] = [
      {
        instanceId: 'monster-1',
        side: 'enemies',
        source: { kind: 'monster', sourceId: 'troll', label: 'Troll' },
        stats: { armorClass: 15, maxHitPoints: 30, currentHitPoints: 20, initiativeModifier: 2, dexterityScore: 14 },
        attacks: [],
        activeEffects: [],
        runtimeEffects: [],
        turnHooks: [
          {
            id: 'loathsome-limbs',
            label: 'Loathsome Limbs',
            boundary: 'end',
            requirements: [
              { kind: 'self-state', state: 'bloodied' },
              { kind: 'damage-taken-this-turn', damageType: 'slashing', min: 15 },
            ],
            effects: [{ kind: 'state', stateId: 'limb-severed' }],
          },
        ],
        conditions: [],
        states: [],
      },
      {
        instanceId: 'pc-1',
        side: 'party',
        source: { kind: 'pc', sourceId: 'pc-1', label: 'Cleric' },
        stats: { armorClass: 18, maxHitPoints: 20, currentHitPoints: 20, initiativeModifier: 0, dexterityScore: 10 },
        attacks: [],
        activeEffects: [],
        runtimeEffects: [],
        turnHooks: [],
        conditions: [],
        states: [],
      },
    ]

    const started = createEncounterState(combatants, {
      rng: () => 0.45,
    })
    const unmet = advanceEncounterTurn(started)
    const damaged = applyDamageToCombatant(started, 'monster-1', 15, {
      damageType: 'slashing',
    })
    const met = advanceEncounterTurn(damaged)

    expect(unmet.log.some((entry) => entry.summary.includes('hook requirements not met: Loathsome Limbs'))).toBe(true)
    expect(unmet.combatantsById['monster-1'].states).toEqual([])
    expect(met.log.some((entry) => entry.summary.includes('hook fires: Loathsome Limbs'))).toBe(true)
    expect(met.combatantsById['monster-1'].states.map((marker) => marker.label)).toContain('limb-severed')
  })

  it('logs descriptive note entries for supported monster-specific hook payloads', () => {
    const combatants: CombatantInstance[] = [
      {
        instanceId: 'monster-1',
        side: 'enemies',
        source: { kind: 'monster', sourceId: 'troll', label: 'Troll' },
        stats: { armorClass: 15, maxHitPoints: 30, currentHitPoints: 20, initiativeModifier: 2, dexterityScore: 14 },
        attacks: [],
        activeEffects: [],
        runtimeEffects: [],
        turnHooks: [
          {
            id: 'loathsome-limbs',
            label: 'Loathsome Limbs',
            boundary: 'end',
            requirements: [
              { kind: 'self-state', state: 'bloodied' },
              { kind: 'damage-taken-this-turn', damageType: 'slashing', min: 15 },
            ],
            effects: [
              {
                kind: 'tracked-part',
                part: 'limb',
                change: {
                  mode: 'sever',
                  count: 1,
                },
              },
              {
                kind: 'spawn',
                creature: 'Troll Limb',
                count: 1,
                location: 'self-space',
                actsWhen: 'immediately-after-source-turn',
              },
              {
                kind: 'custom',
                id: 'monster.resource_from_tracked_parts',
              },
            ],
          },
        ],
        conditions: [],
        states: [],
      },
      {
        instanceId: 'pc-1',
        side: 'party',
        source: { kind: 'pc', sourceId: 'pc-1', label: 'Cleric' },
        stats: { armorClass: 18, maxHitPoints: 20, currentHitPoints: 20, initiativeModifier: 0, dexterityScore: 10 },
        attacks: [],
        activeEffects: [],
        runtimeEffects: [],
        turnHooks: [],
        conditions: [],
        states: [],
      },
    ]

    const started = createEncounterState(combatants, {
      rng: () => 0.45,
    })
    const damaged = applyDamageToCombatant(started, 'monster-1', 15, {
      damageType: 'slashing',
    })
    const resolved = advanceEncounterTurn(damaged)
    const summaries = resolved.log.map((entry) => entry.summary)

    expect(summaries).toContain('Troll hook fires: Loathsome Limbs.')
    expect(summaries).toContain('Loathsome Limbs: Sever 1 limb.')
    expect(summaries).toContain('Loathsome Limbs: Spawn 1 Troll Limb at self-space.')
    expect(summaries).toContain('Loathsome Limbs: Custom effect: monster.resource_from_tracked_parts.')
  })

  it('executes shared manual hook save branches for reduced-to-0 effects', () => {
    const combatants: CombatantInstance[] = [
      {
        instanceId: 'monster-1',
        side: 'enemies',
        source: { kind: 'monster', sourceId: 'zombie', label: 'Zombie' },
        stats: { armorClass: 8, maxHitPoints: 22, currentHitPoints: 0, initiativeModifier: -2, dexterityScore: 6 },
        attacks: [],
        activeEffects: [],
        runtimeEffects: [],
        turnHooks: [],
        conditions: [],
        states: [],
      },
    ]

    const started = createEncounterState(combatants, {
      rng: () => 0.45,
    })
    const succeeded = triggerManualHook(
      started,
      'monster-1',
      'Undead Fortitude',
      [
        {
          kind: 'save',
          save: {
            ability: 'con',
            dc: { kind: '5-plus-damage-taken' },
          },
          onFail: [],
          onSuccess: [{ kind: 'note', text: 'Drops to 1 Hit Point instead.' }],
        },
      ],
      {
        details: 'Manual reduced_to_0_hp event.',
        saveOutcome: 'success',
      },
    )
    const failed = triggerManualHook(
      started,
      'monster-1',
      'Undead Fortitude',
      [
        {
          kind: 'save',
          save: {
            ability: 'con',
            dc: { kind: '5-plus-damage-taken' },
          },
          onFail: [],
          onSuccess: [{ kind: 'note', text: 'Drops to 1 Hit Point instead.' }],
        },
      ],
      {
        details: 'Manual reduced_to_0_hp event.',
        saveOutcome: 'fail',
      },
    )

    expect(succeeded.combatantsById['monster-1'].stats.currentHitPoints).toBe(1)
    expect(succeeded.log.map((entry) => entry.type).slice(-4)).toEqual([
      'hook-triggered',
      'note',
      'note',
      'healing-applied',
    ])
    expect(failed.combatantsById['monster-1'].stats.currentHitPoints).toBe(0)
    expect(failed.log.map((entry) => entry.summary).slice(-2)).toEqual([
      'Zombie hook fires: Undead Fortitude.',
      'Undead Fortitude: Save con -> fail.',
    ])
  })
})
