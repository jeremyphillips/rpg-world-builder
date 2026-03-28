import { describe, expect, it } from 'vitest'

import { moveCombatant } from '@/features/encounter/space'
import { createSquareGridSpace } from '@/features/encounter/space/creation/createSquareGridSpace'
import {
  addConditionToCombatant,
  addStateToCombatant,
  canPerceiveTargetOccupantForCombat,
  createEncounterState,
  getCombatantIdsEligibleForOpportunityAttackAgainstMover,
  getOpportunityAttackLegalityDenialReason,
  canReactorPerceiveDepartingOccupantForOpportunityAttack,
  didHostileMoverLeaveMeleeReachOfReactor,
} from '@/features/mechanics/domain/encounter/state'

import type { EncounterState } from '@/features/mechanics/domain/encounter/state/types'

import { testEnemy, testPc } from './encounter-visibility-test-fixtures'

/** Ensures the mover has movement budget (only the active combatant gets turn resources reset in createEncounterState). */
function withMovementRemaining(state: EncounterState, combatantId: string, feet: number): EncounterState {
  const c = state.combatantsById[combatantId]
  if (!c) return state
  const tr = c.turnResources
  return {
    ...state,
    combatantsById: {
      ...state.combatantsById,
      [combatantId]: {
        ...c,
        turnResources: tr
          ? { ...tr, movementRemaining: feet }
          : {
              actionAvailable: true,
              bonusActionAvailable: true,
              reactionAvailable: true,
              opportunityAttackReactionsRemaining: 0,
              movementRemaining: feet,
              hasCastBonusActionSpell: false,
            },
      },
    },
  }
}

/** Party at c-0-0, enemy at c-1-0 (5ft reach); enemy can move east to c-2-0 and leave reach. */
function encounterAdjacentHostilePair() {
  const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
  const w = testPc('w', 'Wizard', 20)
  const o = testEnemy('o', 'Orc', 20)
  const base = createEncounterState([w, o], { rng: () => 0.5, space })
  const state = withMovementRemaining(
    {
      ...base,
      placements: [
        { combatantId: 'w', cellId: 'c-0-0' },
        { combatantId: 'o', cellId: 'c-1-0' },
      ],
    },
    'o',
    30,
  )
  return { state }
}

describe('opportunity attack legality', () => {
  it('delegates sight to canPerceiveTargetOccupantForCombat (same boolean)', () => {
    const { state } = encounterAdjacentHostilePair()
    expect(canReactorPerceiveDepartingOccupantForOpportunityAttack(state, 'w', 'o')).toBe(
      canPerceiveTargetOccupantForCombat(state, 'w', 'o'),
    )
  })

  it('allows OA when hostile mover leaves reach, reactor has reaction, and occupant is perceivable', () => {
    const { state: before } = encounterAdjacentHostilePair()
    const after = moveCombatant(before, 'o', 'c-2-0')
    expect(getOpportunityAttackLegalityDenialReason(before, after, 'o', 'w')).toBe(null)
    expect(getCombatantIdsEligibleForOpportunityAttackAgainstMover(before, after, 'o')).toEqual(['w'])
  })

  it('denies OA when mover did not leave reach (still within 5ft)', () => {
    const { state: before } = encounterAdjacentHostilePair()
    const after = moveCombatant(before, 'o', 'c-1-1')
    expect(getOpportunityAttackLegalityDenialReason(before, after, 'o', 'w')).toBe('did-not-leave-reach')
  })

  it('denies OA when target is invisible and reactor lacks see-invisibility', () => {
    const { state: before } = encounterAdjacentHostilePair()
    const beforeInvis = addConditionToCombatant(before, 'o', 'invisible')
    const after = moveCombatant(beforeInvis, 'o', 'c-2-0')
    expect(getOpportunityAttackLegalityDenialReason(beforeInvis, after, 'o', 'w')).toBe(
      'cannot-perceive-departing-occupant',
    )
  })

  it('allows OA when invisible but reactor has see-invisibility (shared seam)', () => {
    const { state: before } = encounterAdjacentHostilePair()
    let s = addConditionToCombatant(before, 'o', 'invisible')
    s = addStateToCombatant(s, 'w', 'see-invisibility')
    const after = moveCombatant(s, 'o', 'c-2-0')
    expect(getOpportunityAttackLegalityDenialReason(s, after, 'o', 'w')).toBe(null)
  })

  it('denies OA when reactor is blinded', () => {
    const { state: before } = encounterAdjacentHostilePair()
    const blind = addConditionToCombatant(before, 'w', 'blinded')
    const after = moveCombatant(blind, 'o', 'c-2-0')
    expect(getOpportunityAttackLegalityDenialReason(blind, after, 'o', 'w')).toBe(
      'cannot-perceive-departing-occupant',
    )
  })

  it('denies OA when heavy obscurement blocks occupant perception (pre-move state)', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const wiz = testPc('wiz', 'Wizard', 20)
    const orc = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([wiz, orc], { rng: () => 0.5, space })
    const before = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-heavy',
          kind: 'patch',
          sourceKind: 'manual',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { visibilityObscured: 'heavy' },
        },
      ],
    }
    const beforeMoved = withMovementRemaining(before, 'orc', 30)
    const after = moveCombatant(beforeMoved, 'orc', 'c-2-0')
    expect(getOpportunityAttackLegalityDenialReason(beforeMoved, after, 'orc', 'wiz')).toBe(
      'cannot-perceive-departing-occupant',
    )
  })

  it('denies OA when magical darkness on mover cell blocks occupant perception', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const wiz = testPc('wiz', 'Wizard', 20)
    const orc = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([wiz, orc], { rng: () => 0.5, space })
    const before = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-md',
          kind: 'patch',
          sourceKind: 'manual',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { lightingLevel: 'darkness', visibilityObscured: 'heavy' },
          magical: { magical: true, magicalDarkness: true, blocksDarkvision: true },
        },
      ],
    }
    const beforeMoved = withMovementRemaining(before, 'orc', 30)
    const after = moveCombatant(beforeMoved, 'orc', 'c-2-0')
    expect(getOpportunityAttackLegalityDenialReason(beforeMoved, after, 'orc', 'wiz')).toBe(
      'cannot-perceive-departing-occupant',
    )
  })

  it('spatial leave-reach is false when tactical grid is missing (no bespoke OA geometry)', () => {
    const w = testPc('w', 'Wizard', 20)
    const o = testEnemy('o', 'Orc', 20)
    const noGrid = createEncounterState([w, o], { rng: () => 0.5 })
    expect(noGrid.space).toBeUndefined()
    expect(
      didHostileMoverLeaveMeleeReachOfReactor(noGrid, noGrid, 'o', 'w', 5),
    ).toBe(false)
    expect(getOpportunityAttackLegalityDenialReason(noGrid, noGrid, 'o', 'w')).toBe('did-not-leave-reach')
  })

  it('denies OA when reactor has no reaction budget', () => {
    const { state: before } = encounterAdjacentHostilePair()
    const wTr = before.combatantsById.w!
    const noReaction = {
      ...before,
      combatantsById: {
        ...before.combatantsById,
        w: {
          ...wTr,
          turnResources: {
            ...wTr.turnResources!,
            reactionAvailable: false,
            opportunityAttackReactionsRemaining: 0,
          },
        },
      },
    }
    const after = moveCombatant(noReaction, 'o', 'c-2-0')
    expect(getOpportunityAttackLegalityDenialReason(noReaction, after, 'o', 'w')).toBe('no-reaction-budget')
  })

  it('denies OA for non-hostile (same side)', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const a = testPc('a', 'Ally', 20)
    const b = testPc('b', 'Buddy', 20)
    const base = createEncounterState([a, b], { rng: () => 0.5, space })
    const before = withMovementRemaining(
      {
        ...base,
        placements: [
          { combatantId: 'a', cellId: 'c-0-0' },
          { combatantId: 'b', cellId: 'c-1-0' },
        ],
      },
      'b',
      30,
    )
    const after = moveCombatant(before, 'b', 'c-2-0')
    expect(getOpportunityAttackLegalityDenialReason(before, after, 'b', 'a')).toBe('not-hostile')
  })
})
