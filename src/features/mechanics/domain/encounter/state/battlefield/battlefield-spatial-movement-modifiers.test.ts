import { describe, expect, it } from 'vitest'

import { createSquareGridSpace } from '@/features/encounter/space'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds'
import { getSystemSpell } from '@/features/mechanics/domain/rulesets/system/spells'
import type { CombatantInstance, EncounterState } from '../types'
import {
  getEffectiveGroundMovementBudgetFt,
  getSpatialAttachedAuraSpeedMultiplier,
} from './battlefield-spatial-movement-modifiers'

function base(id: string, side: CombatantInstance['side']): CombatantInstance {
  return {
    instanceId: id,
    side,
    source: { kind: side === 'party' ? 'pc' : 'monster', sourceId: id, label: id },
    stats: {
      armorClass: 10,
      maxHitPoints: 40,
      currentHitPoints: 40,
      initiativeModifier: 0,
      dexterityScore: 10,
      abilityScores: { wisdom: 10 },
      savingThrowModifiers: { wisdom: 0 },
      speeds: { ground: 30 },
    },
    attacks: [],
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
  }
}

function stateWithAura(goblinCell: string): EncounterState {
  const space = createSquareGridSpace({ id: 's', name: 't', columns: 8, rows: 8 })
  const cleric = base('cleric', 'party')
  const goblin = base('goblin', 'enemies')
  return {
    combatantsById: { cleric, goblin },
    partyCombatantIds: ['cleric'],
    enemyCombatantIds: ['goblin'],
    initiative: [],
    initiativeOrder: ['goblin', 'cleric'],
    activeCombatantId: 'goblin',
    turnIndex: 0,
    roundNumber: 1,
    started: true,
    log: [],
    space,
    placements: [
      { combatantId: 'cleric', cellId: 'c-0-0' },
      { combatantId: 'goblin', cellId: goblinCell },
    ],
    attachedAuraInstances: [
      {
        id: 'aura-sg',
        casterCombatantId: 'cleric',
        source: { kind: 'spell', spellId: 'spirit-guardians' },
        anchor: { kind: 'creature', combatantId: 'cleric' },
        area: { kind: 'sphere', size: 15 },
        unaffectedCombatantIds: [],
        saveDc: 13,
      },
    ],
  }
}

describe('battlefield spatial movement modifiers', () => {
  const spell = getSystemSpell(DEFAULT_SYSTEM_RULESET_ID, 'spirit-guardians')
  if (!spell) throw new Error('spirit-guardians spell missing from system ruleset')

  const lookup = (id: string) => (id === 'spirit-guardians' ? spell : undefined)
  const ctx = { spellLookup: lookup }

  it('returns multiplier 1 when the combatant is outside the aura', () => {
    const s = stateWithAura('c-0-5')
    const goblin = s.combatantsById.goblin!
    expect(getSpatialAttachedAuraSpeedMultiplier(s, 'goblin', ctx)).toBe(1)
    expect(getEffectiveGroundMovementBudgetFt(goblin, s, ctx)).toBe(30)
  })

  it('halves effective speed while inside Spirit Guardians (authored 0.5 multiply)', () => {
    const s = stateWithAura('c-0-1')
    const goblin = s.combatantsById.goblin!
    expect(getSpatialAttachedAuraSpeedMultiplier(s, 'goblin', ctx)).toBe(0.5)
    expect(getEffectiveGroundMovementBudgetFt(goblin, s, ctx)).toBe(15)
  })

  it('does not apply to the aura source', () => {
    const s = stateWithAura('c-0-1')
    const cleric = s.combatantsById.cleric!
    expect(getSpatialAttachedAuraSpeedMultiplier(s, 'cleric', ctx)).toBe(1)
    expect(getEffectiveGroundMovementBudgetFt(cleric, s, ctx)).toBe(30)
  })

  it('respects unaffectedCombatantIds', () => {
    const s = stateWithAura('c-0-1')
    const withExempt: EncounterState = {
      ...s,
      attachedAuraInstances: s.attachedAuraInstances!.map((a) => ({
        ...a,
        unaffectedCombatantIds: ['goblin'],
      })),
    }
    const goblin = withExempt.combatantsById.goblin!
    expect(getSpatialAttachedAuraSpeedMultiplier(withExempt, 'goblin', ctx)).toBe(1)
    expect(getEffectiveGroundMovementBudgetFt(goblin, withExempt, ctx)).toBe(30)
  })
})
