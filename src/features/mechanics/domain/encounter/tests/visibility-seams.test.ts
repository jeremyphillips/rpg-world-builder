import { describe, expect, it } from 'vitest'

import {
  addConditionToCombatant,
  addStateToCombatant,
  applyNoiseAwarenessForSubject,
  createEncounterState,
  canPerceiveTargetOccupantForCombat,
  canSeeForTargeting,
  lineOfEffectClear,
  lineOfSightClear,
  resolveTargetLocationAwareness,
} from '../state'
import { getActionTargetInvalidReason, isValidActionTarget } from '../resolution/action/action-targeting'
import type { CombatActionDefinition } from '../resolution/combat-action.types'
import type { CombatantInstance } from '../state'
import type { EncounterState } from '../state/types'

import { createSquareGridSpace } from '@/features/encounter/space/creation/createSquareGridSpace'

import {
  encounterAttackerOutsideDefenderHeavilyObscured,
  encounterAttackerOutsideDefenderMagicalDarknessCell,
  testEnemy,
  testPc,
} from './encounter-visibility-test-fixtures'

/** Wizard c-0-0, orc c-1-0 (5 ft); heavy obscurement on orc cell only — in melee range but occupant unseen. */
function encounterAdjacentHeavyObscuredOrc(): EncounterState {
  const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
  const wiz = testPc('wiz', 'Wizard', 20)
  const orc = testEnemy('orc', 'Orc', 20)
  const base = createEncounterState([wiz, orc], { rng: () => 0.5, space })
  return {
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
}

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

const meleeWeaponAttack: CombatActionDefinition = {
  id: 'test-melee',
  label: 'Melee',
  kind: 'weapon-attack',
  cost: { action: true },
  resolutionMode: 'attack-roll',
  targeting: { kind: 'single-target', rangeFt: 5 },
}

describe('isValidActionTarget + guessed location (not sight)', () => {
  it('weapon attack without requiresSight: unseen + no guess fails (fully unknown)', () => {
    const state = encounterAdjacentHeavyObscuredOrc()
    const w = state.combatantsById.wiz!
    const orc = state.combatantsById.orc!
    expect(canSeeForTargeting(state, 'wiz', 'orc')).toBe(false)
    expect(isValidActionTarget(state, orc, w, meleeWeaponAttack)).toBe(false)
    expect(getActionTargetInvalidReason(state, orc, w, meleeWeaponAttack)).toBe('Target location unknown')
  })

  it('weapon attack: guessed cell allows target when occupant unseen (attack visibility unchanged elsewhere)', () => {
    const base = encounterAdjacentHeavyObscuredOrc()
    const state = applyNoiseAwarenessForSubject(base, 'orc', { kind: 'attack' })
    const w = state.combatantsById.wiz!
    const orc = state.combatantsById.orc!
    expect(resolveTargetLocationAwareness(state, 'wiz', 'orc').kind).toBe('guessed-location')
    expect(isValidActionTarget(state, orc, w, meleeWeaponAttack)).toBe(true)
  })

  it('requiresSight still fails when only guessed location exists (guessed is not visible)', () => {
    const base = encounterAdjacentHeavyObscuredOrc()
    const state = applyNoiseAwarenessForSubject(base, 'orc', { kind: 'attack' })
    const w = state.combatantsById.wiz!
    const orc = state.combatantsById.orc!
    const spellWithSight: CombatActionDefinition = {
      id: 'test',
      label: 'Test',
      kind: 'spell',
      cost: { action: true },
      resolutionMode: 'effects',
      targeting: { kind: 'single-target', requiresSight: true, rangeFt: 120 },
    }
    expect(isValidActionTarget(state, orc, w, spellWithSight)).toBe(false)
    expect(getActionTargetInvalidReason(state, orc, w, spellWithSight)).toBe('Target not visible')
  })

  it('allowGuessedLocationWhenUnseen: false forces sight-only without requiresSight flag', () => {
    const base = encounterAdjacentHeavyObscuredOrc()
    const state = applyNoiseAwarenessForSubject(base, 'orc', { kind: 'attack' })
    const w = state.combatantsById.wiz!
    const orc = state.combatantsById.orc!
    const noGuessTargeting: CombatActionDefinition = {
      ...meleeWeaponAttack,
      targeting: { ...meleeWeaponAttack.targeting!, allowGuessedLocationWhenUnseen: false },
    }
    expect(isValidActionTarget(state, orc, w, noGuessTargeting)).toBe(false)
    expect(getActionTargetInvalidReason(state, orc, w, noGuessTargeting)).toBe('Target location unknown')
  })

  it('no tactical grid: permissive occupant sight still allows weapon target (unchanged)', () => {
    const w = pc('w', 'Wizard', 20)
    const g = enemy('g', 'Goblin', 10)
    const state = createEncounterState([w, g], { rng: () => 0.5 })
    expect(canSeeForTargeting(state, 'w', 'g')).toBe(true)
    expect(isValidActionTarget(state, g, w, meleeWeaponAttack)).toBe(true)
  })
})
