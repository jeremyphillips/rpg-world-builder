import { describe, expect, it } from 'vitest'

import {
  addConditionToCombatant,
  addStateToCombatant,
  createEncounterState,
  canSeeForTargeting,
  lineOfEffectClear,
  lineOfSightClear,
} from '../state'
import { isValidActionTarget } from '../resolution/action/action-targeting'
import type { CombatActionDefinition } from '../resolution/combat-action.types'
import type { CombatantInstance } from '../state'

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
  })

  it('canSeeForTargeting is false when target is invisible and observer lacks See Invisibility', () => {
    const w = pc('w', 'Wizard', 20)
    const g = enemy('g', 'Goblin', 10)
    const state = createEncounterState([w, g], { rng: () => 0.5 })
    const withInvis = addConditionToCombatant(state, 'g', 'invisible')
    expect(canSeeForTargeting(withInvis, 'w', 'g')).toBe(false)
  })

  it('canSeeForTargeting is true when observer has see-invisibility and target is invisible', () => {
    const w = pc('w', 'Wizard', 20)
    const g = enemy('g', 'Goblin', 10)
    const state = createEncounterState([w, g], { rng: () => 0.5 })
    const withSee = addStateToCombatant(state, 'w', 'see-invisibility')
    const withBoth = addConditionToCombatant(withSee, 'g', 'invisible')
    expect(canSeeForTargeting(withBoth, 'w', 'g')).toBe(true)
  })
})

describe('isValidActionTarget + requiresSight', () => {
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
})
