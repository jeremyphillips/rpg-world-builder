import { describe, expect, it } from 'vitest'

import { createSquareGridSpace } from '@/features/encounter/space'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds'
import { getSystemSpell } from '@/features/mechanics/domain/rulesets/system/spells'
import type { CombatantInstance } from '../types'
import type { EncounterState } from '../types'
import { resolveIntervalEffectsForCombatantAtTurnBoundary } from './battlefield-interval-resolution'

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
    combatantsById: { cleric: cleric, goblin },
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

describe('resolveIntervalEffectsForCombatantAtTurnBoundary', () => {
  const spell = getSystemSpell(DEFAULT_SYSTEM_RULESET_ID, 'spirit-guardians')
  if (!spell) throw new Error('spirit-guardians spell missing from system ruleset')

  const lookup = (id: string) => (id === 'spirit-guardians' ? spell : undefined)

  it('does not deal damage when the acting combatant is outside the aura radius', () => {
    const s = stateWithAura('c-0-5')
    const next = resolveIntervalEffectsForCombatantAtTurnBoundary(s, 'goblin', 'end', {
      spellLookup: lookup,
      rng: () => 0.5,
    })
    expect(next.log.filter((e) => e.type === 'damage-applied')).toHaveLength(0)
  })

  it('resolves save and damage when inside the aura (Spirit Guardians)', () => {
    const s = stateWithAura('c-0-1')
    const next = resolveIntervalEffectsForCombatantAtTurnBoundary(s, 'goblin', 'end', {
      spellLookup: lookup,
      rng: () => 0.5,
    })
    const notes = next.log.filter((e) => e.type === 'note')
    expect(notes.some((e) => e.summary.includes('(aura)') && e.summary.toLowerCase().includes('save'))).toBe(
      true,
    )
    expect(next.log.some((e) => e.type === 'damage-applied')).toBe(true)
  })

  it('skips allies when suppressSameSideHostile is true', () => {
    const s = stateWithAura('c-0-1')
    const ally = base('ally', 'party')
    const state: EncounterState = {
      ...s,
      combatantsById: { ...s.combatantsById, ally },
      partyCombatantIds: ['cleric', 'ally'],
      attachedAuraInstances: s.attachedAuraInstances?.map((a) => ({
        ...a,
        unaffectedCombatantIds: [],
      })),
      placements: [
        { combatantId: 'cleric', cellId: 'c-0-0' },
        { combatantId: 'ally', cellId: 'c-0-1' },
      ],
    }
    const next = resolveIntervalEffectsForCombatantAtTurnBoundary(state, 'ally', 'end', {
      spellLookup: lookup,
      suppressSameSideHostile: true,
      rng: () => 0.5,
    })
    expect(next.log.filter((e) => e.type === 'damage-applied')).toHaveLength(0)
  })



  it('uses place anchor cell for interval geometry (not caster position)', () => {
    const space = createSquareGridSpace({ id: 's', name: 't', columns: 8, rows: 8 })
    const cleric = base('cleric', 'party')
    const goblin = base('goblin', 'enemies')
    const s: EncounterState = {
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
        { combatantId: 'cleric', cellId: 'c-1-0' },
        { combatantId: 'goblin', cellId: 'c-0-1' },
      ],
      attachedAuraInstances: [
        {
          id: 'aura-place',
          casterCombatantId: 'cleric',
          source: { kind: 'spell', spellId: 'spirit-guardians' },
          anchor: { kind: 'place', cellId: 'c-0-0' },
          area: { kind: 'sphere', size: 15 },
          unaffectedCombatantIds: [],
          saveDc: 13,
        },
      ],
    }
    const next = resolveIntervalEffectsForCombatantAtTurnBoundary(s, 'goblin', 'end', {
      spellLookup: lookup,
      rng: () => 0.5,
    })
    expect(next.log.some((e) => e.type === 'damage-applied')).toBe(true)
  })

  it('no-ops for boundary other than end', () => {
    const s = stateWithAura('c-0-1')
    const next = resolveIntervalEffectsForCombatantAtTurnBoundary(s, 'goblin', 'start', {
      spellLookup: lookup,
      rng: () => 0.5,
    })
    expect(next.log).toHaveLength(0)
  })
})
