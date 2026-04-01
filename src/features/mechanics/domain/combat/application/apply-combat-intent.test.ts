import { describe, expect, it } from 'vitest'

import type { CombatantInstance } from '../state'
import { createEncounterState } from '../state'
import { createSquareGridSpace } from '../space/creation/createSquareGridSpace'
import { applyCombatIntent } from './apply-combat-intent'
import { createCombatant } from '../tests/action-resolution.test-helpers'

function baseCombatant(
  id: string,
  side: CombatantInstance['side'],
  hp: number,
  initMod: number,
): CombatantInstance {
  return {
    instanceId: id,
    side,
    source: { kind: side === 'party' ? 'pc' : 'monster', sourceId: id, label: id },
    stats: {
      armorClass: 10,
      maxHitPoints: 20,
      currentHitPoints: hp,
      initiativeModifier: initMod,
      dexterityScore: 10,
    },
    attacks: [],
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
  }
}

function withGridMovement(c: CombatantInstance): CombatantInstance {
  return {
    ...c,
    stats: { ...c.stats, speeds: { ground: 120 } },
    turnResources: {
      actionAvailable: true,
      bonusActionAvailable: true,
      reactionAvailable: true,
      opportunityAttackReactionsRemaining: 1,
      movementRemaining: 120,
      hasCastBonusActionSpell: false,
    },
  }
}

describe('applyCombatIntent', () => {
  it('fails with no-encounter-state when state is null', () => {
    const result = applyCombatIntent(null, { kind: 'end-turn' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('no-encounter-state')
  })

  it('applies end-turn and returns success with next state and events', () => {
    const combatants: CombatantInstance[] = [
      baseCombatant('monster-1', 'enemies', 0, 2),
      baseCombatant('pc-1', 'party', 20, 0),
    ]
    const started = createEncounterState(combatants, { rng: () => 0.45 })
    expect(started.activeCombatantId).toBe('pc-1')

    const result = applyCombatIntent(started, { kind: 'end-turn' }, { advanceEncounterTurnOptions: { rng: () => 0.45 } })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.nextState.roundNumber).toBe(2)
    expect(result.events.some((e) => e.kind === 'turn-ended')).toBe(true)
    const logEvents = result.events.filter((e): e is Extract<typeof e, { kind: 'log-appended' }> => e.kind === 'log-appended')
    expect(logEvents.length).toBeGreaterThanOrEqual(0)
  })

  it('rejects end-turn when actorId does not match active combatant', () => {
    const combatants: CombatantInstance[] = [
      baseCombatant('monster-1', 'enemies', 20, 2),
      baseCombatant('pc-1', 'party', 20, 0),
    ]
    const started = createEncounterState(combatants, { rng: () => 0.5 })
    const result = applyCombatIntent(started, { kind: 'end-turn', actorId: 'wrong-id' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('actor-mismatch')
  })

  it('applies move-combatant on grid and emits combatant-moved', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const wiz = withGridMovement(baseCombatant('wiz', 'party', 20, 0))
    const orc = withGridMovement(baseCombatant('orc', 'enemies', 20, 0))
    const base = createEncounterState([wiz, orc], { rng: () => 0.5, space })
    const state = {
      ...base,
      initiativeOrder: ['wiz', 'orc'],
      activeCombatantId: 'wiz',
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-4-4' },
      ],
    }

    const result = applyCombatIntent(state, {
      kind: 'move-combatant',
      combatantId: 'wiz',
      destinationCellId: 'c-1-0',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    const moved = result.events.find((e) => e.kind === 'combatant-moved')
    expect(moved?.kind).toBe('combatant-moved')
    if (moved?.kind === 'combatant-moved') {
      expect(moved.combatantId).toBe('wiz')
      expect(moved.fromCellId).toBe('c-0-0')
      expect(moved.toCellId).toBe('c-1-0')
    }
  })

  it('fails move-combatant when move is illegal (no-op)', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const wiz = withGridMovement(baseCombatant('wiz', 'party', 20, 0))
    const base = createEncounterState([wiz], { rng: () => 0.5, space })
    const state = {
      ...base,
      initiativeOrder: ['wiz'],
      activeCombatantId: 'wiz',
      enemyCombatantIds: [],
      placements: [{ combatantId: 'wiz', cellId: 'c-0-0' }],
    }

    const result = applyCombatIntent(state, {
      kind: 'move-combatant',
      combatantId: 'wiz',
      destinationCellId: 'c-9-9',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('validation-failed')
  })

  it('rejects move-combatant when combatantId is not active', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const wiz = withGridMovement(baseCombatant('wiz', 'party', 20, 0))
    const orc = withGridMovement(baseCombatant('orc', 'enemies', 20, 0))
    const base = createEncounterState([wiz, orc], { rng: () => 0.5, space })
    const state = {
      ...base,
      initiativeOrder: ['wiz', 'orc'],
      activeCombatantId: 'wiz',
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-4-4' },
      ],
    }

    const result = applyCombatIntent(state, {
      kind: 'move-combatant',
      combatantId: 'orc',
      destinationCellId: 'c-5-4',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('actor-mismatch')
  })

  it('applies resolve-action and emits action-resolved', () => {
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
      { rng: () => 0.1 },
    )

    const result = applyCombatIntent(
      state,
      {
        kind: 'resolve-action',
        actorId: 'actor',
        targetId: 'target',
        actionId: 'slash',
      },
      { resolveCombatActionOptions: { rng: () => 0.7 } },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.events.some((e) => e.kind === 'action-resolved')).toBe(true)
    const ar = result.events.find((e) => e.kind === 'action-resolved')
    if (ar?.kind === 'action-resolved') {
      expect(ar.actorId).toBe('actor')
      expect(ar.actionId).toBe('slash')
    }
  })
})
