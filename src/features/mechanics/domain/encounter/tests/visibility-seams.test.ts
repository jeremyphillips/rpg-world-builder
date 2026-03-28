import { describe, expect, it } from 'vitest'

import {
  addConditionToCombatant,
  addStateToCombatant,
  createEncounterState,
  canPerceiveTargetOccupantForCombat,
  canSeeForTargeting,
  lineOfEffectClear,
  lineOfSightClear,
} from '../state'
import { getActionTargetInvalidReason, isValidActionTarget } from '../resolution/action/action-targeting'
import type { CombatActionDefinition } from '../resolution/combat-action.types'
import type { CombatantInstance } from '../state'

import {
  encounterAttackerOutsideDefenderHeavilyObscured,
  encounterAttackerOutsideDefenderMagicalDarknessCell,
  testEnemy,
  testPc,
} from './encounter-visibility-test-fixtures'

function pc(id: string, label: string, hp: number, extra?: Partial<CombatantInstance>): CombatantInstance {
  return {
    instanceId: id,
    side: 'party',
    source: { kind: 'pc', sourceId: id, label },
    stats: {
      armorClass: 14,
      maxHitPoints: hp,
      currentHitPoints: hp,
      initiativeModifier: 0,
      dexterityScore: 14,
      ...extra?.stats,
    },
    attacks: [],
    actions: [],
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: extra?.conditions ?? [],
    states: extra?.states ?? [],
    ...extra,
  }
}

function enemy(id: string, label: string, hp: number, extra?: Partial<CombatantInstance>): CombatantInstance {
  return {
    instanceId: id,
    side: 'enemies',
    source: { kind: 'monster', sourceId: id, label },
    stats: {
      armorClass: 12,
      maxHitPoints: hp,
      currentHitPoints: hp,
      initiativeModifier: 0,
      dexterityScore: 10,
      ...extra?.stats,
    },
    attacks: [],
    actions: [],
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: extra?.conditions ?? [],
    states: extra?.states ?? [],
    ...extra,
  }
}

/** `canSeeForTargeting` is a thin API over `canPerceiveTargetOccupantForCombat` (same boolean). */
function expectTargetingMatchesSharedSeam(
  state: Parameters<typeof canSeeForTargeting>[0],
  observerId: string,
  targetId: string,
): void {
  expect(canSeeForTargeting(state, observerId, targetId)).toBe(
    canPerceiveTargetOccupantForCombat(state, observerId, targetId),
  )
}

describe('visibility seams', () => {
  it('lineOfSightClear and lineOfEffectClear are clear when no grid (no space/placements)', () => {
    const a = pc('a', 'A', 10)
    const b = enemy('b', 'B', 10)
    const state = createEncounterState([a, b], { rng: () => 0.5 })
    expect(lineOfSightClear('a', 'b', state)).toBe(true)
    expect(lineOfEffectClear('a', 'b', state)).toBe(true)
  })

  it('canSeeForTargeting is false when observer is blinded', () => {
    const w = pc('w', 'Wizard', 20)
    const g = enemy('g', 'Goblin', 10)
    const blind = addConditionToCombatant(createEncounterState([w, g], { rng: () => 0.5 }), 'w', 'blinded')
    expect(canSeeForTargeting(blind, 'w', 'g')).toBe(false)
    expectTargetingMatchesSharedSeam(blind, 'w', 'g')
  })

  it('canSeeForTargeting is false when target is invisible and observer lacks See Invisibility', () => {
    const w = pc('w', 'Wizard', 20)
    const g = enemy('g', 'Goblin', 10)
    const state = createEncounterState([w, g], { rng: () => 0.5 })
    const withInvis = addConditionToCombatant(state, 'g', 'invisible')
    expect(canSeeForTargeting(withInvis, 'w', 'g')).toBe(false)
    expectTargetingMatchesSharedSeam(withInvis, 'w', 'g')
  })

  it('canSeeForTargeting is true when observer has see-invisibility and target is invisible', () => {
    const w = pc('w', 'Wizard', 20)
    const g = enemy('g', 'Goblin', 10)
    const state = createEncounterState([w, g], { rng: () => 0.5 })
    const withSee = addStateToCombatant(state, 'w', 'see-invisibility')
    const withBoth = addConditionToCombatant(withSee, 'g', 'invisible')
    expect(canSeeForTargeting(withBoth, 'w', 'g')).toBe(true)
    expectTargetingMatchesSharedSeam(withBoth, 'w', 'g')
  })

  it('permissive tactical fallback: no grid still allows sight targeting when conditions allow', () => {
    const w = pc('w', 'Wizard', 20)
    const g = enemy('g', 'Goblin', 10)
    const state = createEncounterState([w, g], { rng: () => 0.5 })
    expect(state.space).toBeUndefined()
    expect(canSeeForTargeting(state, 'w', 'g')).toBe(true)
    expectTargetingMatchesSharedSeam(state, 'w', 'g')
  })

  it('heavy obscurement: cell may be modeled but occupant not perceivable — canSeeForTargeting false', () => {
    const state = encounterAttackerOutsideDefenderHeavilyObscured()
    expect(canSeeForTargeting(state, 'wiz', 'orc')).toBe(false)
    expectTargetingMatchesSharedSeam(state, 'wiz', 'orc')
  })

  it('magical darkness on target cell only: occupant not perceivable from outside — canSeeForTargeting false', () => {
    const state = encounterAttackerOutsideDefenderMagicalDarknessCell()
    expect(canSeeForTargeting(state, 'wiz', 'orc')).toBe(false)
    expectTargetingMatchesSharedSeam(state, 'wiz', 'orc')
  })
})

describe('isValidActionTarget + requiresSight (shared occupant seam)', () => {
  const spellWithSight: CombatActionDefinition = {
    id: 'test',
    label: 'Test',
    kind: 'spell',
    cost: { action: true },
    resolutionMode: 'effects',
    targeting: { kind: 'single-target', requiresSight: true },
  }

  it('rejects invisible target when action requires sight', () => {
    const w = pc('w', 'Wizard', 20)
    const g = enemy('g', 'Goblin', 10)
    const state = createEncounterState([w, g], { rng: () => 0.5 })
    const withInvis = addConditionToCombatant(state, 'g', 'invisible')
    expect(isValidActionTarget(withInvis, withInvis.combatantsById.g!, w, spellWithSight)).toBe(false)
  })

  it('allows visible target when action requires sight', () => {
    const w = pc('w', 'Wizard', 20)
    const g = enemy('g', 'Goblin', 10)
    const state = createEncounterState([w, g], { rng: () => 0.5 })
    expect(isValidActionTarget(state, g, w, spellWithSight)).toBe(true)
  })

  it('rejects target in heavy obscurement when occupant not perceivable (requires sight)', () => {
    const state = encounterAttackerOutsideDefenderHeavilyObscured()
    const w = state.combatantsById.wiz!
    const orc = state.combatantsById.orc!
    expect(isValidActionTarget(state, orc, w, spellWithSight)).toBe(false)
    expect(getActionTargetInvalidReason(state, orc, w, spellWithSight)).toBe('Target not visible')
  })

  it('rejects target in magical darkness cell when occupant not perceivable (requires sight)', () => {
    const state = encounterAttackerOutsideDefenderMagicalDarknessCell()
    const w = state.combatantsById.wiz!
    const orc = state.combatantsById.orc!
    expect(isValidActionTarget(state, orc, w, spellWithSight)).toBe(false)
    expect(getActionTargetInvalidReason(state, orc, w, spellWithSight)).toBe('Target not visible')
  })

  it('blinded caster fails requiresSight through shared seam', () => {
    const w = testPc('wiz', 'Wizard', 20)
    const orc = testEnemy('orc', 'Orc', 20)
    const state = addConditionToCombatant(
      createEncounterState([w, orc], { rng: () => 0.5 }),
      'wiz',
      'blinded',
    )
    expect(isValidActionTarget(state, orc, state.combatantsById.wiz!, spellWithSight)).toBe(false)
    expect(getActionTargetInvalidReason(state, orc, state.combatantsById.wiz!, spellWithSight)).toBe(
      'Target not visible',
    )
  })
})
