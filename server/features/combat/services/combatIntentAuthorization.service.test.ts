// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { CombatIntent } from '@rpg-world-builder/mechanics'
import type { EncounterState } from '@rpg-world-builder/mechanics'

import type { GameSessionApi } from '../../gameSession/services/gameSession.service'
import { authorizeCombatIntentForGameSession } from './combatIntentAuthorization.service'

function baseGameSession(overrides: Partial<GameSessionApi> = {}): GameSessionApi {
  return {
    id: 'gs1',
    campaignId: 'camp1',
    dmUserId: 'user-dm',
    status: 'active',
    title: 'Test',
    scheduledFor: null,
    location: { locationId: null, buildingId: null, floorId: null, label: null },
    participants: [],
    opponentRefKeys: [],
    activeEncounterId: 'combat-s1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

/** Minimal encounter stub: active monster + PC ally. */
function encounterMonsterActive(): EncounterState {
  return {
    activeCombatantId: 'm1',
    combatantsById: {
      m1: {
        instanceId: 'm1',
        side: 'enemies',
        source: { kind: 'monster', sourceId: 'mon1', label: 'Goblin' },
      } as EncounterState['combatantsById'][string],
      p1: {
        instanceId: 'p1',
        side: 'party',
        source: { kind: 'pc', sourceId: 'char-rogue', label: 'Rogue' },
      } as EncounterState['combatantsById'][string],
    },
    initiativeOrder: ['m1', 'p1'],
    turnIndex: 0,
    roundNumber: 1,
    started: true,
  } as EncounterState
}

function encounterPcActive(): EncounterState {
  return {
    activeCombatantId: 'p1',
    combatantsById: {
      m1: {
        instanceId: 'm1',
        side: 'enemies',
        source: { kind: 'monster', sourceId: 'mon1', label: 'Goblin' },
      } as EncounterState['combatantsById'][string],
      p1: {
        instanceId: 'p1',
        side: 'party',
        source: { kind: 'pc', sourceId: 'char-rogue', label: 'Rogue' },
      } as EncounterState['combatantsById'][string],
    },
    initiativeOrder: ['p1', 'm1'],
    turnIndex: 0,
    roundNumber: 1,
    started: true,
  } as EncounterState
}

describe('authorizeCombatIntentForGameSession', () => {
  it('denies observer for end-turn', () => {
    const gs = baseGameSession({
      participants: [{ userId: 'u-obs', characterId: null, role: 'observer' }],
    })
    const intent: CombatIntent = { kind: 'end-turn' }
    const r = authorizeCombatIntentForGameSession({
      userId: 'u-obs',
      state: encounterMonsterActive(),
      intent,
      gameSession: gs,
    })
    expect(r).toEqual({ allowed: false })
  })

  it('allows DM on monster turn for end-turn', () => {
    const gs = baseGameSession({
      participants: [{ userId: 'user-dm', characterId: null, role: 'dm' }],
    })
    const intent: CombatIntent = { kind: 'end-turn' }
    const r = authorizeCombatIntentForGameSession({
      userId: 'user-dm',
      state: encounterMonsterActive(),
      intent,
      gameSession: gs,
    })
    expect(r).toEqual({ allowed: true })
  })

  it('denies player on monster turn for end-turn', () => {
    const gs = baseGameSession({
      participants: [
        { userId: 'user-dm', characterId: null, role: 'dm' },
        { userId: 'u-pl', characterId: 'char-rogue', role: 'player' },
      ],
    })
    const intent: CombatIntent = { kind: 'end-turn' }
    const r = authorizeCombatIntentForGameSession({
      userId: 'u-pl',
      state: encounterMonsterActive(),
      intent,
      gameSession: gs,
    })
    expect(r).toEqual({ allowed: false })
  })

  it('allows player on their PC turn for end-turn', () => {
    const gs = baseGameSession({
      participants: [{ userId: 'u-pl', characterId: 'char-rogue', role: 'player' }],
    })
    const intent: CombatIntent = { kind: 'end-turn' }
    const r = authorizeCombatIntentForGameSession({
      userId: 'u-pl',
      state: encounterPcActive(),
      intent,
      gameSession: gs,
    })
    expect(r).toEqual({ allowed: true })
  })

  it('denies DM for resolve-action when active is PC they do not control as turn actor', () => {
    const gs = baseGameSession({
      participants: [{ userId: 'user-dm', characterId: null, role: 'dm' }],
    })
    const intent: CombatIntent = {
      kind: 'resolve-action',
      actorId: 'p1',
      actionId: 'weapon-attack',
    }
    const r = authorizeCombatIntentForGameSession({
      userId: 'user-dm',
      state: encounterPcActive(),
      intent,
      gameSession: gs,
    })
    expect(r).toEqual({ allowed: false })
  })

  it('allows player resolve-action when actor is their PC', () => {
    const gs = baseGameSession({
      participants: [{ userId: 'u-pl', characterId: 'char-rogue', role: 'player' }],
    })
    const intent: CombatIntent = {
      kind: 'resolve-action',
      actorId: 'p1',
      actionId: 'weapon-attack',
    }
    const r = authorizeCombatIntentForGameSession({
      userId: 'u-pl',
      state: encounterPcActive(),
      intent,
      gameSession: gs,
    })
    expect(r).toEqual({ allowed: true })
  })

  it('allows DM move-combatant for monster', () => {
    const gs = baseGameSession({
      participants: [{ userId: 'user-dm', characterId: null, role: 'dm' }],
    })
    const intent: CombatIntent = {
      kind: 'move-combatant',
      combatantId: 'm1',
      destinationCellId: 'c1',
    }
    const r = authorizeCombatIntentForGameSession({
      userId: 'user-dm',
      state: encounterMonsterActive(),
      intent,
      gameSession: gs,
    })
    expect(r).toEqual({ allowed: true })
  })

  it('infers player seat from encounter + roster when user is missing from participants', () => {
    const gs = baseGameSession({
      participants: [{ userId: 'user-dm', characterId: null, role: 'dm' }],
    })
    const intent: CombatIntent = { kind: 'end-turn' }
    const roster = [{ id: 'char-rogue', ownerUserId: 'u-pl' }]
    const r = authorizeCombatIntentForGameSession({
      userId: 'u-pl',
      state: encounterPcActive(),
      intent,
      gameSession: gs,
      partyRoster: roster,
    })
    expect(r).toEqual({ allowed: true })
  })

  it('allows DM stair-traversal for active combatant', () => {
    const gs = baseGameSession({
      participants: [{ userId: 'user-dm', characterId: null, role: 'dm' }],
    })
    const intent: CombatIntent = {
      kind: 'stair-traversal',
      combatantId: 'm1',
      connectionId: 'conn',
      sourceFloorLocationId: 'f1',
      destinationFloorLocationId: 'f2',
      destinationCellId: 'c-0-0',
      movementCostFt: 5,
      destinationEncounterSpace: {
        id: 'dest',
        name: 'Dest',
        mode: 'square-grid',
        width: 1,
        height: 1,
        cells: [{ id: 'c-0-0', x: 0, y: 0 }],
        scale: { kind: 'grid', cellFeet: 5 },
        locationId: 'f2',
      },
    }
    const r = authorizeCombatIntentForGameSession({
      userId: 'user-dm',
      state: encounterMonsterActive(),
      intent,
      gameSession: gs,
    })
    expect(r).toEqual({ allowed: true })
  })

  it('allows DM open-door for active combatant', () => {
    const gs = baseGameSession({
      participants: [{ userId: 'user-dm', characterId: null, role: 'dm' }],
    })
    const intent: CombatIntent = {
      kind: 'open-door',
      combatantId: 'm1',
      cellIdA: 'c-0-0',
      cellIdB: 'c-1-0',
    }
    const r = authorizeCombatIntentForGameSession({
      userId: 'user-dm',
      state: encounterMonsterActive(),
      intent,
      gameSession: gs,
    })
    expect(r).toEqual({ allowed: true })
  })

  it('denies non-controlling player for move-combatant on monster', () => {
    const gs = baseGameSession({
      participants: [{ userId: 'u-pl', characterId: 'char-rogue', role: 'player' }],
    })
    const intent: CombatIntent = {
      kind: 'move-combatant',
      combatantId: 'm1',
      destinationCellId: 'c1',
    }
    const r = authorizeCombatIntentForGameSession({
      userId: 'u-pl',
      state: encounterMonsterActive(),
      intent,
      gameSession: gs,
    })
    expect(r).toEqual({ allowed: false })
  })
})
