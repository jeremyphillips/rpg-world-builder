import { describe, expect, it } from 'vitest'

import { sanitizeAuthoredDoorState } from '@/shared/domain/locations/map/locationMapDoorAuthoring.helpers'

import type { CombatIntent } from '../intents'
import type { EncounterEdge, EncounterSpace } from '../space/space.types'
import { applyOpenDoorIntent } from './apply-open-door-intent'
import type { EncounterState } from '../state/types'
import type { CombatantInstance } from '../state/types/combatant.types'

function pc(id: string): CombatantInstance {
  return {
    instanceId: id,
    side: 'party',
    source: { kind: 'pc', sourceId: id, label: id },
    stats: {
      armorClass: 10,
      maxHitPoints: 10,
      currentHitPoints: 10,
      initiativeModifier: 0,
      dexterityScore: 10,
      speeds: { ground: 30 },
    },
    attacks: [],
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
    turnResources: {
      actionAvailable: true,
      bonusActionAvailable: true,
      reactionAvailable: true,
      opportunityAttackReactionsRemaining: 1,
      movementRemaining: 30,
      hasCastBonusActionSpell: false,
    },
  }
}

function spaceWithDoor(edge: EncounterEdge, locationId: string | null): EncounterSpace {
  return {
    id: 's1',
    locationId,
    name: 'test',
    mode: 'square-grid',
    width: 3,
    height: 3,
    cells: [
      { id: 'c-0-0', x: 0, y: 0, kind: 'open' },
      { id: 'c-1-0', x: 1, y: 0, kind: 'open' },
      { id: 'c-2-0', x: 2, y: 0, kind: 'open' },
      { id: 'c-0-1', x: 0, y: 1, kind: 'open' },
      { id: 'c-1-1', x: 1, y: 1, kind: 'open' },
      { id: 'c-2-1', x: 2, y: 1, kind: 'open' },
      { id: 'c-0-2', x: 0, y: 2, kind: 'open' },
      { id: 'c-1-2', x: 1, y: 2, kind: 'open' },
      { id: 'c-2-2', x: 2, y: 2, kind: 'open' },
    ],
    edges: [edge],
    scale: { kind: 'grid', cellFeet: 5 },
  }
}

function makeState(space: EncounterSpace, activeId: string): EncounterState {
  const combatant = pc(activeId)
  return {
    combatantsById: { [combatant.instanceId]: combatant },
    partyCombatantIds: [combatant.instanceId],
    enemyCombatantIds: [],
    initiative: [],
    initiativeOrder: [activeId],
    activeCombatantId: activeId,
    turnIndex: 0,
    roundNumber: 1,
    started: true,
    log: [],
    space,
    placements: [{ combatantId: activeId, cellId: 'c-0-0' }],
  }
}

describe('applyOpenDoorIntent', () => {
  const floor = 'floor-1'
  const closedUnlocked: EncounterEdge = {
    fromCellId: 'c-0-0',
    toCellId: 'c-1-0',
    kind: 'door',
    bidirectional: true,
    blocksMovement: true,
    blocksSight: true,
    mapEdgeId: 'between:c-0-0|c-1-0',
    doorState: sanitizeAuthoredDoorState({ openState: 'closed', lockState: 'unlocked' }),
  }

  it('opens an unlocked closed door', () => {
    const space = spaceWithDoor(closedUnlocked, floor)
    const state = makeState(space, 'hero')
    const intent: Extract<CombatIntent, { kind: 'open-door' }> = {
      kind: 'open-door',
      combatantId: 'hero',
      cellIdA: 'c-0-0',
      cellIdB: 'c-1-0',
    }
    const r = applyOpenDoorIntent(state, intent)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const nextSpace = r.nextState.space
    expect(nextSpace?.edges?.[0]?.blocksMovement).toBe(false)
    expect(nextSpace?.edges?.[0]?.doorState?.openState).toBe('open')
  })

  it('rejects locked and barred doors (Phase 1 same failure)', () => {
    const locked: EncounterEdge = {
      ...closedUnlocked,
      doorState: sanitizeAuthoredDoorState({ openState: 'closed', lockState: 'locked' }),
    }
    const barred: EncounterEdge = {
      ...closedUnlocked,
      doorState: sanitizeAuthoredDoorState({ openState: 'closed', lockState: 'barred' }),
    }
    for (const edge of [locked, barred]) {
      const state = makeState(spaceWithDoor(edge, floor), 'hero')
      const intent: Extract<CombatIntent, { kind: 'open-door' }> = {
        kind: 'open-door',
        combatantId: 'hero',
        cellIdA: 'c-0-0',
        cellIdB: 'c-1-0',
      }
      const r = applyOpenDoorIntent(state, intent)
      expect(r.ok).toBe(false)
      if (r.ok) continue
      expect(r.error.code).toBe('validation-failed')
      if (r.error.code !== 'validation-failed') continue
      expect(r.error.issues.some((i) => i.code === 'door-locked')).toBe(true)
    }
  })

  it('rejects when combatant is not on the door segment', () => {
    const space = spaceWithDoor(closedUnlocked, floor)
    const state: EncounterState = {
      ...makeState(space, 'hero'),
      placements: [{ combatantId: 'hero', cellId: 'c-2-2' }],
    }
    const intent: Extract<CombatIntent, { kind: 'open-door' }> = {
      kind: 'open-door',
      combatantId: 'hero',
      cellIdA: 'c-0-0',
      cellIdB: 'c-1-0',
    }
    const r = applyOpenDoorIntent(state, intent)
    expect(r.ok).toBe(false)
  })
})
