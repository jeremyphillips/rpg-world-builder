import { describe, expect, it } from 'vitest'

import type { CombatantInstance } from '../types'
import { getCombatantDisplayLabel } from './combatant-display-label'

function minimalMonster(instanceId: string, sourceId: string, label: string): CombatantInstance {
  return {
    instanceId,
    side: 'enemies',
    source: { kind: 'monster', sourceId, label },
    stats: {
      armorClass: 10,
      maxHitPoints: 10,
      currentHitPoints: 10,
      initiativeModifier: 0,
      dexterityScore: 10,
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      speeds: { ground: 30 },
    },
    attacks: [],
    actions: [],
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
  }
}

describe('getCombatantDisplayLabel', () => {
  it('returns base label when only one combatant shares source kind + id', () => {
    const goblin = minimalMonster('monster-1', 'goblin-uuid', 'Goblin')
    const roster = [goblin, minimalMonster('monster-2', 'orc-uuid', 'Orc')]
    expect(getCombatantDisplayLabel(goblin, roster)).toBe('Goblin')
  })

  it('returns base label when roster is empty except self (no peers)', () => {
    const goblin = minimalMonster('monster-1', 'goblin-uuid', 'Goblin')
    expect(getCombatantDisplayLabel(goblin, [goblin])).toBe('Goblin')
  })

  it('appends (1) and (2) for two same-type monsters, ordered by instanceId', () => {
    const a = minimalMonster('monster-a', 'goblin-uuid', 'Goblin')
    const b = minimalMonster('monster-b', 'goblin-uuid', 'Goblin')
    const roster = [b, a]
    expect(getCombatantDisplayLabel(a, roster)).toBe('Goblin (1)')
    expect(getCombatantDisplayLabel(b, roster)).toBe('Goblin (2)')
  })

  it('appends (1) (2) (3) for three duplicates', () => {
    const x = minimalMonster('m-1', 'wolf', 'Wolf')
    const y = minimalMonster('m-2', 'wolf', 'Wolf')
    const z = minimalMonster('m-3', 'wolf', 'Wolf')
    const roster = [z, x, y]
    expect(getCombatantDisplayLabel(x, roster)).toBe('Wolf (1)')
    expect(getCombatantDisplayLabel(y, roster)).toBe('Wolf (2)')
    expect(getCombatantDisplayLabel(z, roster)).toBe('Wolf (3)')
  })

  it('disambiguates PCs with same sourceId separately from monsters', () => {
    const pc: CombatantInstance = {
      instanceId: 'ally-1',
      side: 'party',
      source: { kind: 'pc', sourceId: 'char-1', label: 'Aldric' },
      stats: {
        armorClass: 10,
        maxHitPoints: 10,
        currentHitPoints: 10,
        initiativeModifier: 0,
        dexterityScore: 10,
        abilityScores: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        },
        speeds: { ground: 30 },
      },
      attacks: [],
      actions: [],
      activeEffects: [],
      runtimeEffects: [],
      turnHooks: [],
      conditions: [],
      states: [],
    }
    const pcCopy = { ...pc, instanceId: 'ally-2' }
    expect(getCombatantDisplayLabel(pc, [pc, pcCopy])).toBe('Aldric (1)')
    expect(getCombatantDisplayLabel(pcCopy, [pc, pcCopy])).toBe('Aldric (2)')
  })
})
