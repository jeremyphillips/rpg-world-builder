import { describe, expect, it } from 'vitest'

import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import { createCombatTurnResources } from '@/features/mechanics/domain/encounter/state/types/combatant.types'

import { deriveCombatantTurnExhaustion } from './combatant-turn-exhaustion'

function strike(): CombatActionDefinition {
  return {
    id: 'strike',
    label: 'Strike',
    kind: 'weapon-attack',
    cost: { action: true },
    targeting: { kind: 'single-target', rangeFt: 5 },
    resolutionMode: 'attack-roll',
  } as CombatActionDefinition
}

describe('deriveCombatantTurnExhaustion', () => {
  it('full resources + available strike → not fully spent', () => {
    const r = deriveCombatantTurnExhaustion({
      combatantActions: [strike()],
      availableActionIds: ['strike'],
      turnResources: createCombatTurnResources(30),
    })
    expect(r.isFullySpent).toBe(false)
    expect(r.hasAnyPrimaryOptionRemaining).toBe(true)
  })

  it('no movement, no actions left in buckets → fully spent', () => {
    const tr = {
      ...createCombatTurnResources(0),
      actionAvailable: false,
      bonusActionAvailable: false,
      movementRemaining: 0
    }
    const r = deriveCombatantTurnExhaustion({
      combatantActions: [strike()],
      availableActionIds: [],
      turnResources: tr,
    })
    expect(r.isFullySpent).toBe(true)
  })
})
