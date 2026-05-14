import { describe, expect, it } from 'vitest'

import type { CombatActionDefinition } from '../resolution'
import { getActionTargetCandidates, resolveCombatAction } from '../resolution'
import { createEncounterState } from '../state'

import { createCombatant } from './action-resolution.test-helpers'

describe('resolveCombatAction — death, resurrection, spawns, and targeting flags', () => {
  it('resurrection spell heals a 0 HP target to 1 HP', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'cleric',
          label: 'Cleric',
          side: 'party',
          initiativeModifier: 3,
          dexterityScore: 10,
          armorClass: 14,
          actions: [
            {
              id: 'raise-dead',
              label: 'Raise Dead',
              kind: 'spell',
              cost: { action: true },
              resolutionMode: 'effects',
              effects: [
                { kind: 'hit-points', mode: 'heal', value: 1 },
                { kind: 'note', text: 'Target revived.' },
              ],
              targeting: { kind: 'dead-creature' },
            },
          ],
        }),
        createCombatant({
          instanceId: 'fallen-ally',
          label: 'Fallen Fighter',
          side: 'party',
          initiativeModifier: 1,
          dexterityScore: 14,
          armorClass: 16,
        }),
      ],
      { rng: () => 0.99 },
    )

    const withDead = {
      ...state,
      combatantsById: {
        ...state.combatantsById,
        'fallen-ally': {
          ...state.combatantsById['fallen-ally']!,
          stats: { ...state.combatantsById['fallen-ally']!.stats, currentHitPoints: 0 },
        },
      },
    }

    const resolved = resolveCombatAction(
      withDead,
      { actorId: 'cleric', actionId: 'raise-dead', targetId: 'fallen-ally' },
      { rng: () => 0.5 },
    )

    expect(resolved.combatantsById['fallen-ally']!.stats.currentHitPoints).toBe(1)
    expect(resolved.log.some((entry) => entry.summary.includes('regains 1 hit points'))).toBe(true)
  })

  it('resurrection spell resolves with no valid targets when target has HP > 0', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'cleric',
          label: 'Cleric',
          side: 'party',
          initiativeModifier: 3,
          dexterityScore: 10,
          armorClass: 14,
          actions: [
            {
              id: 'raise-dead',
              label: 'Raise Dead',
              kind: 'spell',
              cost: { action: true },
              resolutionMode: 'effects',
              effects: [{ kind: 'hit-points', mode: 'heal', value: 1 }],
              targeting: { kind: 'dead-creature' },
            },
          ],
        }),
        createCombatant({
          instanceId: 'alive-ally',
          label: 'Fighter',
          side: 'party',
          initiativeModifier: 1,
          dexterityScore: 14,
          armorClass: 16,
        }),
      ],
      { rng: () => 0.99 },
    )

    const resolved = resolveCombatAction(
      state,
      { actorId: 'cleric', actionId: 'raise-dead', targetId: 'alive-ally' },
      { rng: () => 0.5 },
    )

    expect(resolved.combatantsById['alive-ally']!.stats.currentHitPoints).toBe(12)
    expect(resolved.log.some((entry) => entry.summary.includes('no valid targets'))).toBe(true)
  })

  it('resurrection spell resolves with no valid targets when no target is selected', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'cleric',
          label: 'Cleric',
          side: 'party',
          initiativeModifier: 3,
          dexterityScore: 10,
          armorClass: 14,
          actions: [
            {
              id: 'raise-dead',
              label: 'Raise Dead',
              kind: 'spell',
              cost: { action: true },
              resolutionMode: 'effects',
              effects: [{ kind: 'hit-points', mode: 'heal', value: 1 }],
              targeting: { kind: 'dead-creature' },
            },
          ],
        }),
        createCombatant({
          instanceId: 'fallen-ally',
          label: 'Fallen Fighter',
          side: 'party',
          initiativeModifier: 1,
          dexterityScore: 14,
          armorClass: 16,
        }),
      ],
      { rng: () => 0.99 },
    )

    const withDead = {
      ...state,
      combatantsById: {
        ...state.combatantsById,
        'fallen-ally': {
          ...state.combatantsById['fallen-ally']!,
          stats: { ...state.combatantsById['fallen-ally']!.stats, currentHitPoints: 0 },
        },
      },
    }

    const resolved = resolveCombatAction(
      withDead,
      { actorId: 'cleric', actionId: 'raise-dead' },
      { rng: () => 0.5 },
    )

    expect(resolved.combatantsById['fallen-ally']!.stats.currentHitPoints).toBe(0)
    expect(resolved.log.some((entry) => entry.summary.includes('no valid targets'))).toBe(true)
  })

  it('dead-creature target with disintegrated remains is not valid', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'cleric',
          label: 'Cleric',
          side: 'party',
          initiativeModifier: 3,
          dexterityScore: 10,
          armorClass: 14,
          actions: [
            {
              id: 'raise-dead',
              label: 'Raise Dead',
              kind: 'spell',
              cost: { action: true },
              resolutionMode: 'effects',
              effects: [{ kind: 'hit-points', mode: 'heal', value: 1 }],
              targeting: { kind: 'dead-creature' },
              displayMeta: { source: 'spell', spellId: 'raise-dead', level: 5, concentration: false, range: 'Touch' },
            },
          ],
        }),
        createCombatant({
          instanceId: 'dusty',
          label: 'Dust',
          side: 'party',
          initiativeModifier: 1,
          dexterityScore: 14,
          armorClass: 16,
          currentHitPoints: 0,
          remains: 'disintegrated',
        }),
      ],
      { rng: () => 0.99 },
    )

    const resolved = resolveCombatAction(
      state,
      { actorId: 'cleric', actionId: 'raise-dead', targetId: 'dusty' },
      { rng: () => 0.5 },
    )

    expect(resolved.combatantsById['dusty']!.stats.currentHitPoints).toBe(0)
    expect(resolved.log.some((entry) => entry.summary.includes('no valid targets'))).toBe(true)
  })

  it('Revivify fails when target has been dead more than 1 minute (10 rounds)', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'cleric',
          label: 'Cleric',
          side: 'party',
          initiativeModifier: 3,
          dexterityScore: 10,
          armorClass: 14,
          actions: [
            {
              id: 'revivify',
              label: 'Revivify',
              kind: 'spell',
              cost: { action: true },
              resolutionMode: 'effects',
              effects: [{ kind: 'hit-points', mode: 'heal', value: 1 }],
              targeting: { kind: 'dead-creature' },
              displayMeta: { source: 'spell', spellId: 'revivify', level: 3, concentration: false, range: 'Touch' },
            },
          ],
        }),
        createCombatant({
          instanceId: 'fallen',
          label: 'Late',
          side: 'party',
          initiativeModifier: 1,
          dexterityScore: 14,
          armorClass: 16,
          currentHitPoints: 0,
          remains: 'corpse',
          diedAtRound: 1,
        }),
      ],
      { rng: () => 0.99 },
    )

    const lateRound = { ...state, roundNumber: 20 }

    const resolved = resolveCombatAction(
      lateRound,
      { actorId: 'cleric', actionId: 'revivify', targetId: 'fallen' },
      { rng: () => 0.5 },
    )

    expect(resolved.combatantsById['fallen']!.stats.currentHitPoints).toBe(0)
    expect(resolved.log.some((e) => e.summary.includes('dead too long'))).toBe(true)
  })

  it('Disintegrate lethal damage sets remains to disintegrated', () => {
    const disintegrateAction: CombatActionDefinition = {
      id: 'disintegrate',
      label: 'Disintegrate',
      kind: 'spell',
      cost: { action: true },
      resolutionMode: 'effects',
      effects: [
        {
          kind: 'save',
          save: { ability: 'dex', dc: 15 },
          onFail: [{ kind: 'damage', damage: '10', damageType: 'force' }],
          onSuccess: [],
        },
      ],
      targeting: { kind: 'single-target' },
      displayMeta: {
        source: 'spell',
        spellId: 'disintegrate',
        level: 6,
        concentration: false,
        range: '60 ft',
      },
    }

    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'wiz',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 20,
          dexterityScore: 10,
          armorClass: 12,
          actions: [disintegrateAction],
        }),
        createCombatant({
          instanceId: 'victim',
          label: 'Victim',
          side: 'enemies',
          initiativeModifier: 0,
          dexterityScore: 10,
          armorClass: 10,
          currentHitPoints: 5,
        }),
      ],
      { rng: () => 0.5 },
    )

    const resolved = resolveCombatAction(
      state,
      { actorId: 'wiz', actionId: 'disintegrate', targetId: 'victim' },
      { rng: () => 0 },
    )

    const victim = resolved.combatantsById['victim']!
    expect(victim.stats.currentHitPoints).toBe(0)
    expect(victim.remains).toBe('disintegrated')
  })

  it('death-outcome turns-to-dust sets remains to dust after lethal hit', () => {
    const rottingFist: CombatActionDefinition = {
      id: 'dust-fist',
      label: 'Dust Fist',
      kind: 'weapon-attack',
      cost: { action: true },
      resolutionMode: 'attack-roll',
      targeting: { kind: 'single-target' },
      attackProfile: {
        attackBonus: 50,
        damage: '1',
        damageType: 'bludgeoning',
      },
      onHitEffects: [
        {
          kind: 'death-outcome',
          trigger: 'reduced-to-0-hit-points-by-this-action',
          targetType: 'creature',
          outcome: 'turns-to-dust',
        },
      ],
    }

    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'mummy',
          label: 'Mummy',
          side: 'enemies',
          initiativeModifier: 20,
          dexterityScore: 10,
          armorClass: 11,
          actions: [rottingFist],
        }),
        createCombatant({
          instanceId: 'victim',
          label: 'Victim',
          side: 'party',
          initiativeModifier: 0,
          dexterityScore: 10,
          armorClass: 10,
          currentHitPoints: 1,
        }),
      ],
      { rng: () => 0.5 },
    )

    const resolved = resolveCombatAction(
      state,
      { actorId: 'mummy', actionId: 'dust-fist', targetId: 'victim' },
      // d20 must not be 1 (natural 1 auto-misses); 0.5 → roll 11.
      { rng: () => 0.5 },
    )

    const victim = resolved.combatantsById['victim']!
    expect(victim.stats.currentHitPoints).toBe(0)
    expect(victim.remains).toBe('dust')
  })

  it('effects mode branches by hpThreshold when defined on the action', () => {
    const hpThresholdAction = (id: string): CombatActionDefinition => ({
      id,
      label: 'Power Word Test',
      kind: 'spell',
      cost: { action: true },
      resolutionMode: 'effects',
      hpThreshold: { maxHp: 100 },
      effects: [{ kind: 'damage', damage: '99', damageType: 'psychic' }],
      aboveThresholdEffects: [{ kind: 'damage', damage: '3', damageType: 'psychic' }],
      targeting: { kind: 'single-target' },
      displayMeta: { source: 'spell', spellId: id, level: 9, concentration: false, range: '60 ft' },
    })

    const low = createEncounterState(
      [
        createCombatant({
          instanceId: 'wiz',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 5,
          dexterityScore: 10,
          armorClass: 12,
          actions: [hpThresholdAction('pwk-low')],
        }),
        createCombatant({
          instanceId: 'low',
          label: 'Weakened',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 14,
          armorClass: 13,
          maxHitPoints: 80,
          currentHitPoints: 80,
        }),
      ],
      { rng: () => 0.1 },
    )
    const rLow = resolveCombatAction(
      low,
      { actorId: 'wiz', targetId: 'low', actionId: 'pwk-low' },
      { rng: () => 0.5 },
    )
    expect(rLow.combatantsById['low']?.stats.currentHitPoints).toBe(0)

    const high = createEncounterState(
      [
        createCombatant({
          instanceId: 'wiz',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 5,
          dexterityScore: 10,
          armorClass: 12,
          actions: [hpThresholdAction('pwk-high')],
        }),
        createCombatant({
          instanceId: 'high',
          label: 'Healthy',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 14,
          armorClass: 13,
          maxHitPoints: 200,
          currentHitPoints: 150,
        }),
      ],
      { rng: () => 0.1 },
    )
    const rHigh = resolveCombatAction(
      high,
      { actorId: 'wiz', targetId: 'high', actionId: 'pwk-high' },
      { rng: () => 0.5 },
    )
    expect(rHigh.combatantsById['high']?.stats.currentHitPoints).toBe(147)
  })

  it('effects mode with targeting none resolves spawn without a selected target', () => {
    const spawnAction: CombatActionDefinition = {
      id: 'summon-test',
      label: 'Find Familiar',
      kind: 'spell',
      cost: { action: true },
      resolutionMode: 'effects',
      effects: [
        {
          kind: 'spawn',
          creature: 'familiar',
          count: 1,
          location: 'self-space',
          actsWhen: 'immediately-after-source-turn',
        },
      ],
      targeting: { kind: 'none' },
      displayMeta: {
        source: 'spell',
        spellId: 'find-familiar',
        level: 1,
        concentration: false,
        range: 'Self',
      },
    }

    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'wiz',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 5,
          dexterityScore: 16,
          armorClass: 12,
          actions: [spawnAction],
        }),
        createCombatant({
          instanceId: 'gob',
          label: 'Goblin',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 14,
          armorClass: 15,
        }),
      ],
      { rng: () => 0.5 },
    )

    const resolved = resolveCombatAction(state, { actorId: 'wiz', actionId: 'summon-test' }, { rng: () => 0.5 })

    expect(resolved.log.some((entry) => entry.summary.includes('resolves its effects'))).toBe(true)
    expect(resolved.log.some((entry) => entry.summary.includes('Spawn 1× familiar'))).toBe(true)
  })

  it('allows same-side hostile single-target when suppressSameSideHostileActions is false', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'a',
          label: 'Fighter A',
          side: 'party',
          initiativeModifier: 5,
          dexterityScore: 16,
          armorClass: 16,
          actions: [
            {
              id: 'slash',
              label: 'Slash',
              kind: 'weapon-attack',
              cost: { action: true },
              resolutionMode: 'attack-roll',
              targeting: { kind: 'single-target' },
              attackProfile: {
                attackBonus: 5,
                damage: '1d6 + 2',
                damageType: 'slashing',
              },
            },
          ],
        }),
        createCombatant({
          instanceId: 'b',
          label: 'Fighter B',
          side: 'party',
          initiativeModifier: 4,
          dexterityScore: 14,
          armorClass: 14,
        }),
      ],
      { rng: () => 0.1 },
    )

    const resolved = resolveCombatAction(
      state,
      { actorId: 'a', targetId: 'b', actionId: 'slash' },
      {
        rng: () => 0.7,
        suppressSameSideHostileActions: false,
      },
    )

    expect(resolved.combatantsById['b']?.stats.currentHitPoints).toBeLessThan(12)
  })

  it('blocks same-side hostile single-target when suppressSameSideHostileActions is true', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'a',
          label: 'Fighter A',
          side: 'party',
          initiativeModifier: 5,
          dexterityScore: 16,
          armorClass: 16,
          actions: [
            {
              id: 'slash',
              label: 'Slash',
              kind: 'weapon-attack',
              cost: { action: true },
              resolutionMode: 'attack-roll',
              targeting: { kind: 'single-target' },
              attackProfile: {
                attackBonus: 5,
                damage: '1d6 + 2',
                damageType: 'slashing',
              },
            },
          ],
        }),
        createCombatant({
          instanceId: 'b',
          label: 'Fighter B',
          side: 'party',
          initiativeModifier: 4,
          dexterityScore: 14,
          armorClass: 14,
        }),
      ],
      { rng: () => 0.1 },
    )

    const resolved = resolveCombatAction(
      state,
      { actorId: 'a', targetId: 'b', actionId: 'slash' },
      {
        rng: () => 0.7,
        suppressSameSideHostileActions: true,
      },
    )

    expect(resolved.combatantsById['b']?.stats.currentHitPoints).toBe(12)
  })

  it('dead-creature spell candidates include corpses not in initiativeOrder (after round re-roll drops dead)', () => {
    const animateDead: CombatActionDefinition = {
      id: 'animate-dead',
      label: 'Animate Dead',
      kind: 'spell',
      cost: { action: true },
      resolutionMode: 'effects',
      effects: [],
      targeting: { kind: 'dead-creature', creatureTypeFilter: ['humanoid'] },
    }

    const wizard = createCombatant({
      instanceId: 'wizard',
      label: 'Wizard',
      side: 'party',
      initiativeModifier: 2,
      dexterityScore: 14,
      armorClass: 12,
      creatureType: 'humanoid',
      actions: [animateDead],
    })
    const orc = createCombatant({
      instanceId: 'orc',
      label: 'Orc',
      side: 'enemies',
      initiativeModifier: 1,
      dexterityScore: 12,
      armorClass: 13,
      creatureType: 'humanoid',
      currentHitPoints: 0,
    })

    const base = createEncounterState([wizard, orc], { rng: () => 0.5 })
    const stateDroppedDeadFromInitiative = {
      ...base,
      combatantsById: base.combatantsById,
      initiativeOrder: ['wizard'],
      initiative: base.initiative.filter((r) => r.combatantId === 'wizard'),
    }

    const candidates = getActionTargetCandidates(stateDroppedDeadFromInitiative, wizard, animateDead)
    expect(candidates.map((c) => c.instanceId)).toContain('orc')
  })
})
