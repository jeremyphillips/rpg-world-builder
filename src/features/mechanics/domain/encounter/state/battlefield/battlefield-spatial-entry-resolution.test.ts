import { describe, expect, it } from 'vitest'

import { createSquareGridSpace } from '@/features/encounter/space'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds'
import { getSystemSpell } from '@/features/mechanics/domain/rulesets/system/spells'
import type { CombatantInstance } from '../types'
import type { EncounterState } from '../types'
import { resolveAttachedAuraSpatialEntryAfterMovement } from './battlefield-spatial-entry-resolution'

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

function baseState(placements: { combatantId: string; cellId: string }[]): EncounterState {
  const space = createSquareGridSpace({ id: 's', name: 't', columns: 8, rows: 8 })
  const cleric = base('cleric', 'party')
  const goblin = base('goblin', 'enemies')
  return {
    combatantsById: { cleric, goblin },
    partyCombatantIds: ['cleric'],
    enemyCombatantIds: ['goblin'],
    initiative: [],
    initiativeOrder: ['cleric', 'goblin'],
    activeCombatantId: 'cleric',
    turnIndex: 0,
    roundNumber: 1,
    started: true,
    log: [],
    space,
    placements,
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

describe('resolveAttachedAuraSpatialEntryAfterMovement', () => {
  const spell = getSystemSpell(DEFAULT_SYSTEM_RULESET_ID, 'spirit-guardians')
  if (!spell) throw new Error('spirit-guardians spell missing')

  const lookup = (id: string) => (id === 'spirit-guardians' ? spell : undefined)

  it('triggers when a creature moves from outside to inside the sphere', () => {
    const before = baseState([
      { combatantId: 'cleric', cellId: 'c-0-0' },
      { combatantId: 'goblin', cellId: 'c-0-5' },
    ])
    const after = baseState([
      { combatantId: 'cleric', cellId: 'c-0-0' },
      { combatantId: 'goblin', cellId: 'c-0-1' },
    ])
    const next = resolveAttachedAuraSpatialEntryAfterMovement(before, after, {
      spellLookup: lookup,
      rng: () => 0.5,
    })
    expect(next.log.some((e) => e.type === 'note' && e.summary.includes('entering'))).toBe(true)
    expect(next.log.some((e) => e.type === 'damage-applied')).toBe(true)
  })

  it('triggers when the aura owner moves and the sphere sweeps onto another creature', () => {
    const before = baseState([
      { combatantId: 'cleric', cellId: 'c-0-0' },
      { combatantId: 'goblin', cellId: 'c-0-5' },
    ])
    const after = baseState([
      { combatantId: 'cleric', cellId: 'c-0-4' },
      { combatantId: 'goblin', cellId: 'c-0-5' },
    ])
    const next = resolveAttachedAuraSpatialEntryAfterMovement(before, after, {
      spellLookup: lookup,
      rng: () => 0.5,
    })
    expect(next.log.some((e) => e.type === 'damage-applied')).toBe(true)
  })

  it('does not trigger when already inside before and after', () => {
    const placements = [
      { combatantId: 'cleric', cellId: 'c-0-0' },
      { combatantId: 'goblin', cellId: 'c-0-1' },
    ]
    const before = baseState(placements)
    const after = baseState(placements)
    const next = resolveAttachedAuraSpatialEntryAfterMovement(before, after, {
      spellLookup: lookup,
      rng: () => 0.5,
    })
    expect(next.log.filter((e) => e.type === 'damage-applied')).toHaveLength(0)
  })

  it('respects suppressSameSideHostile for party targets', () => {
    const ally = base('ally', 'party')
    const before: EncounterState = {
      ...baseState([
        { combatantId: 'cleric', cellId: 'c-0-0' },
        { combatantId: 'ally', cellId: 'c-0-5' },
      ]),
      combatantsById: {
        cleric: base('cleric', 'party'),
        ally,
      },
      partyCombatantIds: ['cleric', 'ally'],
      enemyCombatantIds: [],
    }
    const after: EncounterState = {
      ...before,
      placements: [
        { combatantId: 'cleric', cellId: 'c-0-0' },
        { combatantId: 'ally', cellId: 'c-0-1' },
      ],
    }
    const next = resolveAttachedAuraSpatialEntryAfterMovement(before, after, {
      spellLookup: lookup,
      suppressSameSideHostile: true,
      rng: () => 0.5,
    })
    expect(next.log.filter((e) => e.type === 'damage-applied')).toHaveLength(0)
  })
})
