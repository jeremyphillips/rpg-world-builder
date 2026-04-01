import { describe, expect, it } from 'vitest'

import { DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE } from '@/features/mechanics/domain/environment/environment.resolve'
import type { CombatantInstance } from '../state'
import { createEncounterState } from '../state'
import { createSquareGridSpace } from '../space/creation/createSquareGridSpace'
import { startEncounterFromSetup } from './start-encounter-from-setup'

function baseCombatant(
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
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
  }
}

describe('startEncounterFromSetup', () => {
  it('fails when combatants is empty', () => {
    const result = startEncounterFromSetup({ combatants: [] })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('no-combatants')
  })

  it('returns started state aligned with createEncounterState for equivalent options', () => {
    const combatants: CombatantInstance[] = [
      baseCombatant('monster-1', 'enemies', 20, 2),
      baseCombatant('pc-1', 'party', 20, 0),
    ]
    const rng = () => 0.45
    const direct = createEncounterState(combatants, { rng })
    const viaSeam = startEncounterFromSetup({ combatants, rng })
    expect(viaSeam.ok).toBe(true)
    if (!viaSeam.ok) return
    expect(viaSeam.state.started).toBe(true)
    expect(viaSeam.state.initiativeOrder).toEqual(direct.initiativeOrder)
    expect(viaSeam.state.activeCombatantId).toBe(direct.activeCombatantId)
  })

  it('accepts space and environment options', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 4, rows: 4 })
    const wiz = baseCombatant('wiz', 'party', 20, 0)
    const orc = baseCombatant('orc', 'enemies', 20, 0)
    const result = startEncounterFromSetup({
      combatants: [wiz, orc],
      rng: () => 0.5,
      space,
      environmentBaseline: DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.space?.id).toBe('m')
    expect(result.state.environmentBaseline?.lightingLevel).toBe('bright')
  })
})
