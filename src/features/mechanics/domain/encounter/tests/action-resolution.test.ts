import { describe, expect, it } from 'vitest'

import type { CombatActionDefinition } from '../resolution'
import { getCombatantAvailableActions, resolveCombatAction } from '../resolution'
import { advanceEncounterTurn, createEncounterState } from '../state'
import type { CombatantInstance } from '../state'

function createCombatant(args: {
  instanceId: string
  label: string
  side: 'party' | 'enemies'
  initiativeModifier: number
  dexterityScore: number
  armorClass: number
  abilityScores?: {
    strength?: number
    dexterity?: number
    constitution?: number
    intelligence?: number
    wisdom?: number
    charisma?: number
  }
  savingThrowModifiers?: {
    strength?: number
    dexterity?: number
    constitution?: number
    intelligence?: number
    wisdom?: number
    charisma?: number
  }
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
      abilityScores: {
        strength: 10,
        dexterity: args.dexterityScore,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        ...args.abilityScores,
      },
      savingThrowModifiers: args.savingThrowModifiers,
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
              kind: 'weapon-attack',
              cost: { action: true },
              resolutionMode: 'attack-roll',
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
      'action-declared',
      'attack-hit',
      'damage-applied',
      'action-resolved',
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
              kind: 'weapon-attack',
              cost: { action: true },
              resolutionMode: 'attack-roll',
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
      'action-declared',
      'attack-missed',
      'action-resolved',
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
              kind: 'weapon-attack',
              cost: { action: true },
              resolutionMode: 'attack-roll',
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

  it('enforces limited-use monster actions after their uses are spent', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'actor',
          label: 'Gnoll',
          side: 'enemies',
          initiativeModifier: 5,
          dexterityScore: 14,
          armorClass: 15,
          actions: [
            {
              id: 'rampage',
              label: 'Rampage',
              kind: 'monster-action',
              cost: { bonusAction: true },
              resolutionMode: 'log-only',
              usage: {
                uses: {
                  max: 1,
                  remaining: 1,
                  period: 'day',
                },
              },
              logText: 'The gnoll surges forward.',
            },
          ],
        }),
        createCombatant({
          instanceId: 'target',
          label: 'Guard',
          side: 'party',
          initiativeModifier: 1,
          dexterityScore: 12,
          armorClass: 12,
        }),
      ],
      { rng: () => 0.1 }
    )

    expect(getCombatantAvailableActions(state, 'actor').map((action) => action.id)).toContain('rampage')

    const resolved = resolveCombatAction(state, {
      actorId: 'actor',
      actionId: 'rampage',
    })

    expect(resolved.combatantsById['actor']?.actions?.find((action) => action.id === 'rampage')?.usage?.uses?.remaining).toBe(0)
    expect(getCombatantAvailableActions(resolved, 'actor').map((action) => action.id)).not.toContain('rampage')
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
              resolutionMode: 'log-only',
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
      'action-declared',
      'spell-logged',
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
              kind: 'monster-action',
              cost: { bonusAction: true },
              resolutionMode: 'log-only',
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
      opportunityAttackReactionsRemaining: 0,
      movementRemaining: 30,
      hasCastBonusActionSpell: false,
    })
    expect(resolved.log.slice(-2).map((entry) => entry.type)).toEqual([
      'action-declared',
      'action-resolved',
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
                kind: 'monster-action',
                cost: { action: true },
                resolutionMode: 'log-only',
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
                kind: 'monster-action',
                cost: { action: true },
                resolutionMode: 'attack-roll',
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

  it('resolves single-target saving throw actions and applies branch effects', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'mummy',
          label: 'Mummy',
          side: 'enemies',
          initiativeModifier: 5,
          dexterityScore: 8,
          armorClass: 12,
          actions: [
            {
              id: 'dreadful-glare',
              label: 'Dreadful Glare',
              kind: 'monster-action',
              cost: { action: true },
              resolutionMode: 'saving-throw',
              saveProfile: {
                ability: 'wis',
                dc: 11,
              },
              onFailEffects: [{ kind: 'condition', conditionId: 'frightened' }],
              onSuccessEffects: [
                {
                  kind: 'immunity',
                  scope: 'source-action',
                  duration: { kind: 'fixed', value: 24, unit: 'hour' },
                },
              ],
            },
          ],
        }),
        createCombatant({
          instanceId: 'target',
          label: 'Cleric',
          side: 'party',
          initiativeModifier: 1,
          dexterityScore: 12,
          armorClass: 16,
          abilityScores: { wisdom: 10 },
        }),
      ],
      { rng: () => 0.9 }
    )

    const failed = resolveCombatAction(
      state,
      {
        actorId: 'mummy',
        targetId: 'target',
        actionId: 'dreadful-glare',
      },
      {
        rng: () => 0.2,
      },
    )

    expect(failed.combatantsById['target']?.conditions.map((marker) => marker.label)).toContain('frightened')

    const succeeded = resolveCombatAction(
      state,
      {
        actorId: 'mummy',
        targetId: 'target',
        actionId: 'dreadful-glare',
      },
      {
        rng: () => 0.9,
      },
    )

    expect(succeeded.combatantsById['target']?.states.map((marker) => marker.label)).toContain(
      'immune to Dreadful Glare',
    )
  })

  it('applies half damage on successful save to all enemy targets for area actions', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'dragon',
          label: 'Young Red Dragon',
          side: 'enemies',
          initiativeModifier: 5,
          dexterityScore: 10,
          armorClass: 18,
          actions: [
            {
              id: 'fire-breath',
              label: 'Fire Breath',
              kind: 'monster-action',
              cost: { action: true },
              resolutionMode: 'saving-throw',
              damage: '16',
              damageType: 'fire',
              saveProfile: {
                ability: 'dex',
                dc: 17,
                halfDamageOnSave: true,
              },
              targeting: {
                kind: 'all-enemies',
              },
            },
          ],
        }),
        createCombatant({
          instanceId: 'rogue',
          label: 'Rogue',
          side: 'party',
          initiativeModifier: 3,
          dexterityScore: 18,
          armorClass: 15,
          savingThrowModifiers: { dexterity: 8 },
        }),
        createCombatant({
          instanceId: 'fighter',
          label: 'Fighter',
          side: 'party',
          initiativeModifier: 1,
          dexterityScore: 12,
          armorClass: 16,
          savingThrowModifiers: { dexterity: 1 },
        }),
      ],
      { rng: () => 0.9 }
    )

    const resolved = resolveCombatAction(
      state,
      {
        actorId: 'dragon',
        actionId: 'fire-breath',
      },
      {
        rng: () => 0.4, // d20 = 9, flat damage = 16
      },
    )

    expect(resolved.combatantsById['rogue']?.stats.currentHitPoints).toBe(4)
    expect(resolved.combatantsById['fighter']?.stats.currentHitPoints).toBe(0)
  })

  it('resolves movement-targeted save actions like Engulf with state rider notes', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'cube',
          label: 'Gelatinous Cube',
          side: 'enemies',
          initiativeModifier: 5,
          dexterityScore: 3,
          armorClass: 12,
          actions: [
            {
              id: 'engulf',
              label: 'Engulf',
              kind: 'monster-action',
              cost: { action: true },
              resolutionMode: 'saving-throw',
              saveProfile: {
                ability: 'dex',
                dc: 12,
                halfDamageOnSave: true,
              },
              targeting: { kind: 'entered-during-move' },
              movement: {
                upToSpeed: true,
                noOpportunityAttacks: true,
                canEnterCreatureSpaces: true,
                targetSizeMax: 'large',
              },
              onFailEffects: [
                { kind: 'damage', damage: '3d6', damageType: 'acid' },
                {
                  kind: 'state',
                  stateId: 'engulfed',
                  escape: {
                    dc: 12,
                    ability: 'str',
                    skill: 'athletics',
                    actionRequired: true,
                  },
                  ongoingEffects: [
                    { kind: 'condition', conditionId: 'restrained' },
                    { kind: 'damage', damage: '3d6', damageType: 'acid' },
                    { kind: 'note', text: 'Target is suffocating.' },
                    { kind: 'move', movesWithSource: true },
                  ],
                  notes: 'Target takes the acid damage at the start of the cube turns.',
                },
              ],
              onSuccessEffects: [
                { kind: 'damage', damage: '3d6', damageType: 'acid' },
                {
                  kind: 'move',
                  forced: true,
                  withinFeetOfSource: 5,
                  toNearestUnoccupiedSpace: true,
                  failIfNoSpace: true,
                },
              ],
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
          savingThrowModifiers: { dexterity: 1 },
          abilityScores: { strength: 14 },
        }),
      ],
      { rng: () => 0.9 }
    )

    const failed = resolveCombatAction(
      state,
      {
        actorId: 'cube',
        targetId: 'target',
        actionId: 'engulf',
      },
      {
        rng: () => 0.1,
      },
    )

    expect(failed.combatantsById['target']?.states.map((marker) => marker.label)).toContain('engulfed')
    expect(failed.log.some((entry) => entry.summary.includes('selected target as the creature crossed during movement'))).toBe(true)
    expect(failed.log.some((entry) => entry.summary.includes('Escape DC 12 STR (athletics) as an action.'))).toBe(true)
    expect(failed.log.some((entry) => entry.summary.includes('Target is suffocating.'))).toBe(true)

    const succeeded = resolveCombatAction(
      state,
      {
        actorId: 'cube',
        targetId: 'target',
        actionId: 'engulf',
      },
      {
        rng: (() => {
          const rolls = [0.95, 0.1, 0.1, 0.1]
          let index = 0
          return () => rolls[index++] ?? 0.1
        })(),
      },
    )

    expect(succeeded.combatantsById['target']?.stats.currentHitPoints).toBe(9)
    expect(succeeded.log.some((entry) => entry.summary.includes('forced movement'))).toBe(true)
  })

  it('recharges monster actions at the start of their turn before they become available again', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'dragon',
          label: 'Dragon',
          side: 'enemies',
          initiativeModifier: 8,
          dexterityScore: 14,
          armorClass: 18,
          actions: [
            {
              id: 'fire-breath',
              label: 'Fire Breath',
              kind: 'monster-action',
              cost: { action: true },
              resolutionMode: 'saving-throw',
              damage: '8d6',
              damageType: 'fire',
              saveProfile: {
                ability: 'dex',
                dc: 17,
                halfDamageOnSave: true,
              },
              targeting: { kind: 'all-enemies' },
              usage: {
                recharge: {
                  min: 5,
                  max: 6,
                  ready: true,
                },
              },
            },
          ],
        }),
        createCombatant({
          instanceId: 'fighter',
          label: 'Fighter',
          side: 'party',
          initiativeModifier: 1,
          dexterityScore: 10,
          armorClass: 16,
          savingThrowModifiers: { dexterity: 0 },
        }),
      ],
      { rng: () => 0.1 }
    )

    const spent = resolveCombatAction(
      state,
      {
        actorId: 'dragon',
        actionId: 'fire-breath',
      },
      {
        rng: () => 0.1,
      },
    )

    expect(getCombatantAvailableActions(spent, 'dragon').map((action) => action.id)).not.toContain('fire-breath')

    const toFighter = advanceEncounterTurn(spent, { rng: () => 0.1 })
    const recharged = advanceEncounterTurn(toFighter, { rng: () => 0.9 })

    expect(recharged.activeCombatantId).toBe('dragon')
    expect(
      recharged.combatantsById['dragon']?.actions?.find((action) => action.id === 'fire-breath')?.usage?.recharge?.ready,
    ).toBe(true)
    expect(getCombatantAvailableActions(recharged, 'dragon').map((action) => action.id)).toContain('fire-breath')
  })

  it('executes on-hit rider saves for attack-roll monster actions', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'wolf',
          label: 'Wolf',
          side: 'enemies',
          initiativeModifier: 5,
          dexterityScore: 15,
          armorClass: 13,
          actions: [
            {
              id: 'bite',
              label: 'Bite',
              kind: 'monster-action',
              cost: { action: true },
              resolutionMode: 'attack-roll',
              attackProfile: {
                attackBonus: 4,
                damage: '2d4 + 2',
                damageType: 'piercing',
              },
              onHitEffects: [
                {
                  kind: 'save',
                  save: { ability: 'str', dc: 11 },
                  onFail: [{ kind: 'condition', conditionId: 'prone' }],
                },
              ],
            },
          ],
        }),
        createCombatant({
          instanceId: 'target',
          label: 'Cleric',
          side: 'party',
          initiativeModifier: 1,
          dexterityScore: 12,
          armorClass: 12,
          abilityScores: { strength: 10 },
        }),
      ],
      { rng: () => 0.9 }
    )

    const resolved = resolveCombatAction(
      state,
      {
        actorId: 'wolf',
        targetId: 'target',
        actionId: 'bite',
      },
      {
        rng: (() => {
          const rolls = [0.5, 0.1, 0.1]
          let index = 0
          return () => rolls[index++] ?? 0.1
        })(), // hit, low damage, then fail STR save
      },
    )

    expect(resolved.combatantsById['target']?.conditions.map((marker) => marker.label)).toContain('prone')
  })

  it('uses attack-roll onSuccess branches as on-hit effects for monster special actions', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'bugbear',
          label: 'Bugbear',
          side: 'enemies',
          initiativeModifier: 5,
          dexterityScore: 14,
          armorClass: 15,
          actions: [
            {
              id: 'grab',
              label: 'Grab',
              kind: 'monster-action',
              cost: { action: true },
              resolutionMode: 'attack-roll',
              attackProfile: {
                attackBonus: 4,
                damage: '2d6 + 2',
                damageType: 'bludgeoning',
              },
              onHitEffects: [
                {
                  kind: 'condition',
                  conditionId: 'grappled',
                  targetSizeMax: 'medium',
                  escapeDc: 12,
                },
              ],
            },
          ],
        }),
        createCombatant({
          instanceId: 'target',
          label: 'Rogue',
          side: 'party',
          initiativeModifier: 1,
          dexterityScore: 14,
          armorClass: 12,
        }),
      ],
      { rng: () => 0.9 }
    )

    const resolved = resolveCombatAction(
      state,
      {
        actorId: 'bugbear',
        targetId: 'target',
        actionId: 'grab',
      },
      {
        rng: (() => {
          const rolls = [0.5, 0.2, 0.2]
          let index = 0
          return () => rolls[index++] ?? 0.2
        })(),
      },
    )

    expect(resolved.combatantsById['target']?.conditions.map((marker) => marker.label)).toContain('grappled')
  })

  it('resolves save-based spell effects via the effects resolution mode', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'caster',
          label: 'Cleric',
          side: 'party',
          initiativeModifier: 2,
          dexterityScore: 10,
          armorClass: 16,
          actions: [
            {
              id: 'sacred-flame',
              label: 'Sacred Flame',
              kind: 'spell',
              cost: { action: true },
              resolutionMode: 'effects',
              effects: [
                {
                  kind: 'save',
                  save: { ability: 'dex', dc: 13 },
                  onFail: [{ kind: 'damage', damage: '8', damageType: 'radiant' }],
                },
              ],
              targeting: { kind: 'single-target' },
            },
          ],
        }),
        createCombatant({
          instanceId: 'target',
          label: 'Goblin',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 14,
          armorClass: 13,
          savingThrowModifiers: { dexterity: 2 },
        }),
      ],
      { rng: () => 0.1 }
    )

    const failed = resolveCombatAction(
      state,
      { actorId: 'caster', targetId: 'target', actionId: 'sacred-flame' },
      { rng: () => 0.2 },
    )

    expect(failed.combatantsById['target']?.stats.currentHitPoints).toBe(4)
    expect(failed.combatantsById['caster']?.turnResources?.actionAvailable).toBe(false)

    const succeeded = resolveCombatAction(
      state,
      { actorId: 'caster', targetId: 'target', actionId: 'sacred-flame' },
      { rng: () => 0.9 },
    )

    expect(succeeded.combatantsById['target']?.stats.currentHitPoints).toBe(12)
  })

  it('resolves area save spell effects against all enemies', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'caster',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 3,
          dexterityScore: 10,
          armorClass: 12,
          actions: [
            {
              id: 'fireball',
              label: 'Fireball',
              kind: 'spell',
              cost: { action: true },
              resolutionMode: 'effects',
              effects: [
                {
                  kind: 'save',
                  save: { ability: 'dex', dc: 15 },
                  onFail: [{ kind: 'damage', damage: '10', damageType: 'fire' }],
                  onSuccess: [{ kind: 'damage', damage: '5', damageType: 'fire' }],
                },
              ],
              targeting: { kind: 'all-enemies' },
            },
          ],
        }),
        createCombatant({
          instanceId: 'goblin1',
          label: 'Goblin 1',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 14,
          armorClass: 13,
          savingThrowModifiers: { dexterity: 2 },
        }),
        createCombatant({
          instanceId: 'goblin2',
          label: 'Goblin 2',
          side: 'enemies',
          initiativeModifier: 0,
          dexterityScore: 14,
          armorClass: 13,
          savingThrowModifiers: { dexterity: 2 },
        }),
      ],
      { rng: () => 0.1 }
    )

    const resolved = resolveCombatAction(
      state,
      { actorId: 'caster', actionId: 'fireball' },
      { rng: () => 0.2 },
    )

    expect(resolved.combatantsById['goblin1']?.stats.currentHitPoints).toBeLessThan(12)
    expect(resolved.combatantsById['goblin2']?.stats.currentHitPoints).toBeLessThan(12)
    expect(resolved.combatantsById['caster']?.turnResources?.actionAvailable).toBe(false)
    expect(resolved.log.some((entry) => entry.type === 'action-resolved')).toBe(true)
  })

  it('resolves save-based spell applying conditions on failed save', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'caster',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 3,
          dexterityScore: 10,
          armorClass: 12,
          actions: [
            {
              id: 'hold-person',
              label: 'Hold Person',
              kind: 'spell',
              cost: { action: true },
              resolutionMode: 'effects',
              effects: [
                {
                  kind: 'save',
                  save: { ability: 'wis', dc: 14 },
                  onFail: [{ kind: 'condition', conditionId: 'paralyzed' }],
                },
              ],
              targeting: { kind: 'single-target' },
            },
          ],
        }),
        createCombatant({
          instanceId: 'target',
          label: 'Bandit',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 12,
          armorClass: 12,
          abilityScores: { wisdom: 10 },
        }),
      ],
      { rng: () => 0.1 }
    )

    const resolved = resolveCombatAction(
      state,
      { actorId: 'caster', targetId: 'target', actionId: 'hold-person' },
      { rng: () => 0.2 },
    )

    expect(resolved.combatantsById['target']?.conditions.map((m) => m.label)).toContain('paralyzed')
    expect(resolved.combatantsById['caster']?.turnResources?.actionAvailable).toBe(false)
  })

  it('resolves attack-roll spells using the attack-roll path', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'caster',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 3,
          dexterityScore: 10,
          armorClass: 12,
          actions: [
            {
              id: 'fire-bolt',
              label: 'Fire Bolt',
              kind: 'spell',
              cost: { action: true },
              resolutionMode: 'attack-roll',
              attackProfile: {
                attackBonus: 5,
                damage: '10',
                damageType: 'fire',
              },
              targeting: { kind: 'single-target' },
            },
          ],
        }),
        createCombatant({
          instanceId: 'target',
          label: 'Goblin',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 14,
          armorClass: 13,
        }),
      ],
      { rng: () => 0.1 }
    )

    const hit = resolveCombatAction(
      state,
      { actorId: 'caster', targetId: 'target', actionId: 'fire-bolt' },
      { rng: () => 0.7 },
    )

    expect(hit.combatantsById['target']?.stats.currentHitPoints).toBe(2)
    expect(hit.combatantsById['caster']?.turnResources?.actionAvailable).toBe(false)
    expect(hit.log.some((entry) => entry.type === 'attack-hit')).toBe(true)

    const miss = resolveCombatAction(
      state,
      { actorId: 'caster', targetId: 'target', actionId: 'fire-bolt' },
      { rng: () => 0.1 },
    )

    expect(miss.combatantsById['target']?.stats.currentHitPoints).toBe(12)
    expect(miss.log.some((entry) => entry.type === 'attack-missed')).toBe(true)
  })

  it('resolves multi-beam attack spells via sequence steps', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'caster',
          label: 'Warlock',
          side: 'party',
          initiativeModifier: 3,
          dexterityScore: 10,
          armorClass: 12,
          actions: [
            {
              id: 'eldritch-blast',
              label: 'Eldritch Blast',
              kind: 'spell',
              cost: { action: true },
              resolutionMode: 'attack-roll',
              attackProfile: {
                attackBonus: 5,
                damage: '1',
                damageType: 'force',
              },
              targeting: { kind: 'single-target' },
              sequence: [{ actionLabel: 'Eldritch Blast Beam', count: 2 }],
            },
            {
              id: 'eldritch-blast-beam',
              label: 'Eldritch Blast Beam',
              kind: 'spell',
              cost: {},
              resolutionMode: 'attack-roll',
              attackProfile: {
                attackBonus: 5,
                damage: '1',
                damageType: 'force',
              },
              targeting: { kind: 'single-target' },
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

    const resolved = resolveCombatAction(
      state,
      { actorId: 'caster', targetId: 'target', actionId: 'eldritch-blast' },
      { rng: () => 0.7 },
    )

    expect(resolved.combatantsById['target']?.stats.currentHitPoints).toBe(10)
    expect(resolved.combatantsById['caster']?.turnResources?.actionAvailable).toBe(false)
    expect(resolved.log.filter((entry) => entry.type === 'attack-hit')).toHaveLength(2)
    expect(resolved.log[resolved.log.length - 1]?.summary).toBe(
      'Eldritch Blast resolves its action sequence.',
    )
  })

  it('self-targeting effects mode applies modifier to caster AC', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'caster',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 5,
          dexterityScore: 10,
          armorClass: 12,
          actions: [
            {
              id: 'shield-spell',
              label: 'Shield',
              kind: 'spell',
              cost: { reaction: true },
              resolutionMode: 'effects',
              effects: [
                {
                  kind: 'modifier',
                  target: 'armor_class',
                  mode: 'add',
                  value: 5,
                  duration: {
                    kind: 'until-turn-boundary',
                    subject: 'self' as const,
                    turn: 'next' as const,
                    boundary: 'start' as const,
                  },
                },
              ],
              targeting: { kind: 'self' },
            },
          ],
        }),
        createCombatant({
          instanceId: 'enemy',
          label: 'Goblin',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 14,
          armorClass: 13,
        }),
      ],
      { rng: () => 0.1 },
    )

    const resolved = resolveCombatAction(
      state,
      { actorId: 'caster', actionId: 'shield-spell' },
      { rng: () => 0.5 },
    )

    expect(resolved.combatantsById['caster']?.stats.armorClass).toBe(17)
    expect(resolved.combatantsById['caster']?.statModifiers).toHaveLength(1)
    expect(resolved.combatantsById['caster']?.statModifiers?.[0]?.value).toBe(5)
    expect(resolved.combatantsById['caster']?.turnResources?.reactionAvailable).toBe(false)
  })

  it('self-targeting effects mode applies spell immunity as state marker', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'caster',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 5,
          dexterityScore: 10,
          armorClass: 12,
          actions: [
            {
              id: 'shield-spell',
              label: 'Shield',
              kind: 'spell',
              cost: { reaction: true },
              resolutionMode: 'effects',
              effects: [
                {
                  kind: 'immunity',
                  scope: 'spell',
                  spellIds: ['magic-missile'],
                  duration: {
                    kind: 'until-turn-boundary',
                    subject: 'self' as const,
                    turn: 'next' as const,
                    boundary: 'start' as const,
                  },
                  notes: 'You take no damage from Magic Missile.',
                },
              ],
              targeting: { kind: 'self' },
            },
          ],
        }),
        createCombatant({
          instanceId: 'enemy',
          label: 'Goblin',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 14,
          armorClass: 13,
        }),
      ],
      { rng: () => 0.1 },
    )

    const resolved = resolveCombatAction(
      state,
      { actorId: 'caster', actionId: 'shield-spell' },
      { rng: () => 0.5 },
    )

    expect(resolved.combatantsById['caster']?.states.some((s) => s.label.includes('magic-missile'))).toBe(true)
  })

  it('stat modifier marker expires and reverts AC at turn boundary', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'caster',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 5,
          dexterityScore: 10,
          armorClass: 12,
          actions: [
            {
              id: 'shield-spell',
              label: 'Shield',
              kind: 'spell',
              cost: { reaction: true },
              resolutionMode: 'effects',
              effects: [
                {
                  kind: 'modifier',
                  target: 'armor_class',
                  mode: 'add',
                  value: 5,
                  duration: {
                    kind: 'until-turn-boundary',
                    subject: 'self' as const,
                    turn: 'next' as const,
                    boundary: 'start' as const,
                  },
                },
              ],
              targeting: { kind: 'self' },
            },
          ],
        }),
        createCombatant({
          instanceId: 'enemy',
          label: 'Goblin',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 14,
          armorClass: 13,
        }),
      ],
      { rng: () => 0.1 },
    )

    const withShield = resolveCombatAction(
      state,
      { actorId: 'caster', actionId: 'shield-spell' },
      { rng: () => 0.5 },
    )

    expect(withShield.combatantsById['caster']?.stats.armorClass).toBe(17)

    const afterEnemyTurn = advanceEncounterTurn(withShield)
    expect(afterEnemyTurn.combatantsById['caster']?.stats.armorClass).toBe(17)

    const afterCasterTurnStart = advanceEncounterTurn(afterEnemyTurn)
    expect(afterCasterTurnStart.combatantsById['caster']?.stats.armorClass).toBe(12)
    expect(afterCasterTurnStart.combatantsById['caster']?.statModifiers).toHaveLength(0)
    expect(afterCasterTurnStart.log.some((entry) => entry.summary.includes('stat modifier expires'))).toBe(true)
  })

  it('effects resolution logs "no valid targets" when no enemies remain', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'caster',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 3,
          dexterityScore: 10,
          armorClass: 12,
          actions: [
            {
              id: 'spell',
              label: 'Test Spell',
              kind: 'spell',
              cost: { action: true },
              resolutionMode: 'effects',
              effects: [
                {
                  kind: 'save',
                  save: { ability: 'dex', dc: 13 },
                  onFail: [{ kind: 'damage', damage: '8', damageType: 'fire' }],
                },
              ],
              targeting: { kind: 'single-target' },
            },
          ],
        }),
        createCombatant({
          instanceId: 'ally',
          label: 'Fighter',
          side: 'party',
          initiativeModifier: 1,
          dexterityScore: 14,
          armorClass: 16,
        }),
      ],
      { rng: () => 0.1 }
    )

    const resolved = resolveCombatAction(
      state,
      { actorId: 'caster', actionId: 'spell' },
      { rng: () => 0.5 },
    )

    expect(resolved.log.some((entry) => entry.summary.includes('no valid targets'))).toBe(true)
  })

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
})
