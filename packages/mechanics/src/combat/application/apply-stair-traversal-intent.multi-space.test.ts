import { describe, expect, it } from 'vitest'

import type { CombatIntent } from '../intents'
import type { EncounterSpace } from '../space/space.types'
import { applyStairTraversalIntent } from './apply-stair-traversal-intent'
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
      speeds: { ground: 120 },
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
      movementRemaining: 120,
      hasCastBonusActionSpell: false,
    },
  }
}

function minimalSpace(id: string, locationId: string | null): EncounterSpace {
  return {
    id,
    locationId,
    name: id,
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
    scale: { kind: 'grid', cellFeet: 5 },
  }
}

describe('applyStairTraversalIntent — multi-space registry', () => {
  it('merges destination space into spacesById and keeps source space for other combatants', () => {
    const floorA = 'floor-a'
    const floorB = 'floor-b'
    const sourceSpace = minimalSpace('space-a', floorA)
    const destSpace = minimalSpace('space-b', floorB)

    const ally = pc('ally-1')
    const mover = pc('mover-1')
    const state: EncounterState = {
      combatantsById: { [ally.instanceId]: ally, [mover.instanceId]: mover },
      partyCombatantIds: [ally.instanceId, mover.instanceId],
      enemyCombatantIds: [],
      initiative: [],
      initiativeOrder: [mover.instanceId],
      activeCombatantId: mover.instanceId,
      turnIndex: 0,
      roundNumber: 1,
      started: true,
      log: [],
      space: sourceSpace,
      spacesById: { [sourceSpace.id]: sourceSpace },
      placements: [
        {
          combatantId: ally.instanceId,
          cellId: 'c-0-0',
          floorLocationId: floorA,
          encounterSpaceId: sourceSpace.id,
        },
        {
          combatantId: mover.instanceId,
          cellId: 'c-1-0',
          floorLocationId: floorA,
          encounterSpaceId: sourceSpace.id,
        },
      ],
    }

    const intent: Extract<CombatIntent, { kind: 'stair-traversal' }> = {
      kind: 'stair-traversal',
      combatantId: mover.instanceId,
      connectionId: 'conn-test-1',
      sourceFloorLocationId: floorA,
      destinationFloorLocationId: floorB,
      destinationEncounterSpace: destSpace,
      destinationCellId: 'c-1-1',
      movementCostFt: 5,
    }

    const result = applyStairTraversalIntent(state, intent, {})
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const next = result.nextState
    expect(next.spacesById?.[sourceSpace.id]).toBeDefined()
    expect(next.spacesById?.[destSpace.id]).toBeDefined()
    expect(next.spacesById?.[sourceSpace.id]?.id).toBe('space-a')
    expect(next.spacesById?.[destSpace.id]?.id).toBe('space-b')

    const allyP = next.placements?.find((p) => p.combatantId === ally.instanceId)
    const moverP = next.placements?.find((p) => p.combatantId === mover.instanceId)
    expect(allyP?.encounterSpaceId).toBe(sourceSpace.id)
    expect(allyP?.floorLocationId).toBe(floorA)
    expect(moverP?.encounterSpaceId).toBe(destSpace.id)
    expect(moverP?.cellId).toBe('c-1-1')
  })
})
