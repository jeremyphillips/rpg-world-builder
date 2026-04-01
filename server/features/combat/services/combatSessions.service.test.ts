// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { CombatantInstance } from '@rpg-world-builder/mechanics'

import {
  parseCombatStartupBody,
  startCombatSession,
} from './combatSessions.service'

function minimalCombatant(
  id: string,
  side: CombatantInstance['side'],
  hp: number,
  initMod: number,
): CombatantInstance {
  return {
    instanceId: id,
    side,
    source: { kind: side === 'party' ? 'pc' : 'monster', sourceId: id, label: id },
    stats: {
      armorClass: 10,
      maxHitPoints: 20,
      currentHitPoints: hp,
      initiativeModifier: initMod,
      dexterityScore: 10,
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

describe('combatSessions.service', () => {
  it('parses a valid startup body', () => {
    const body = {
      combatants: [minimalCombatant('a', 'party', 20, 0)],
    }
    const parsed = parseCombatStartupBody(body)
    expect(parsed.ok).toBe(true)
  })

  it('rejects non-object body', () => {
    expect(parseCombatStartupBody(null).ok).toBe(false)
    expect(parseCombatStartupBody([]).ok).toBe(false)
    expect(parseCombatStartupBody('x').ok).toBe(false)
  })

  it('rejects missing combatants array', () => {
    const parsed = parseCombatStartupBody({})
    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.error.code).toBe('invalid-body')
  })

  it('returns initialized state for one combatant', () => {
    const result = startCombatSession({
      combatants: [minimalCombatant('solo', 'party', 20, 0)],
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.started).toBe(true)
    expect(result.state.activeCombatantId).toBeDefined()
  })

  it('returns structured failure for empty combatants', () => {
    const result = startCombatSession({ combatants: [] })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('no-combatants')
  })
})
