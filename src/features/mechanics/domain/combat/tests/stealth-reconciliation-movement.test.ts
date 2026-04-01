import { describe, expect, it } from 'vitest'

import { createSquareGridSpace } from '@/features/mechanics/domain/combat/space/creation/createSquareGridSpace'
import { moveCombatant } from '@/features/mechanics/domain/combat/space/selectors/space.selectors'
import {
  createEncounterState,
  reconcileBattlefieldEffectAnchors,
  reconcileStealthAfterMovementOrEnvironmentChange,
  applyEncounterEnvironmentBaselinePatchAndReconcileStealth,
} from '@/features/mechanics/domain/combat/state'
import type { CombatantInstance } from '@/features/mechanics/domain/combat/state/types/combatant.types'
import type { EncounterState } from '@/features/mechanics/domain/combat/state/types/encounter-state.types'

function combatant(
  id: string,
  side: 'party' | 'enemies',
  label: string,
  overrides: Partial<CombatantInstance> = {},
): CombatantInstance {
  return {
    instanceId: id,
    side,
    source: { kind: side === 'party' ? 'pc' : 'monster', sourceId: id, label },
    stats: {
      armorClass: 14,
      maxHitPoints: 20,
      currentHitPoints: 20,
      initiativeModifier: 0,
      dexterityScore: 14,
      abilityScores: {
        strength: 10,
        dexterity: 14,
        constitution: 10,
        intelligence: 10,
        wisdom: 12,
        charisma: 10,
      },
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
    ...overrides,
  }
}

/** Same anchor pass as after `moveCombatant` in `applyMoveCombatantIntent` / grid move. */
function afterGridMoveLikeRuntime(state: EncounterState, moverId: string, targetCellId: string): EncounterState {
  const moved = moveCombatant(state, moverId, targetCellId)
  if (moved === state) return state
  return reconcileBattlefieldEffectAnchors(moved)
}

describe('stealth reconciliation — movement & environment integration', () => {
  it('moving out of heavy obscurement removes hidden-from when observer can perceive (perception reconcile)', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const wiz = combatant('wiz', 'party', 'Wizard')
    const orc = combatant('orc', 'enemies', 'Orc', {
      stealth: { hiddenFromObserverIds: ['wiz'] },
    })
    const base = createEncounterState([wiz, orc], { rng: () => 0.5, space })
    const state: EncounterState = {
      ...base,
      partyCombatantIds: ['wiz'],
      enemyCombatantIds: ['orc'],
      initiativeOrder: ['orc', 'wiz'],
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-2-2' },
      ],
      environmentZones: [
        {
          id: 'z-heavy',
          kind: 'patch',
          sourceKind: 'manual',
          area: { kind: 'grid-cell-ids', cellIds: ['c-2-2'] },
          overrides: { visibilityObscured: 'heavy' },
        },
      ],
    }

    const next = afterGridMoveLikeRuntime(state, 'orc', 'c-5-5')

    expect(next.combatantsById.orc?.stealth).toBeUndefined()
  })

  it('moving within heavy obscurement preserves hidden state when world still supports concealment', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const wiz = combatant('wiz', 'party', 'Wizard')
    const orc = combatant('orc', 'enemies', 'Orc', {
      stealth: { hiddenFromObserverIds: ['wiz'] },
    })
    const base = createEncounterState([wiz, orc], { rng: () => 0.5, space })
    const state: EncounterState = {
      ...base,
      partyCombatantIds: ['wiz'],
      enemyCombatantIds: ['orc'],
      initiativeOrder: ['orc', 'wiz'],
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-2-2' },
      ],
      environmentZones: [
        {
          id: 'z-heavy',
          kind: 'patch',
          sourceKind: 'manual',
          area: { kind: 'grid-cell-ids', cellIds: ['c-2-2', 'c-3-2'] },
          overrides: { visibilityObscured: 'heavy' },
        },
      ],
    }

    const next = afterGridMoveLikeRuntime(state, 'orc', 'c-3-2')

    expect(next.combatantsById.orc?.stealth?.hiddenFromObserverIds).toContain('wiz')
  })

  it('applyEncounterEnvironmentBaselinePatchAndReconcileStealth clears stealth when global lighting removes concealment support', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const wiz = combatant('wiz', 'party', 'Wizard')
    const orc = combatant('orc', 'enemies', 'Orc', {
      stealth: { hiddenFromObserverIds: ['wiz'] },
    })
    const base = createEncounterState([wiz, orc], { rng: () => 0.5, space })
    const state: EncounterState = {
      ...base,
      partyCombatantIds: ['wiz'],
      enemyCombatantIds: ['orc'],
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-2-2' },
      ],
      environmentBaseline: {
        setting: 'indoors',
        lightingLevel: 'dim',
        visibilityObscured: 'light',
        terrainMovement: 'normal',
        atmosphereTags: [],
      },
    }

    const next = applyEncounterEnvironmentBaselinePatchAndReconcileStealth(state, {
      lightingLevel: 'bright',
      visibilityObscured: 'none',
    })

    expect(next.combatantsById.orc?.stealth).toBeUndefined()
  })

  it('reconcileStealthAfterMovementOrEnvironmentChange is a no-op when no one has stealth', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const wiz = combatant('wiz', 'party', 'Wizard')
    const orc = combatant('orc', 'enemies', 'Orc')
    const base = createEncounterState([wiz, orc], { rng: () => 0.5, space })
    const next = reconcileStealthAfterMovementOrEnvironmentChange(base)
    expect(next).toBe(base)
  })
})
