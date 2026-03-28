import { createSquareGridSpace } from '@/features/encounter/space/creation/createSquareGridSpace'

import { createEncounterState } from '../state'
import type { CombatantInstance } from '../state/types'
import type { EncounterState } from '../state/types'

export function testPc(id: string, label: string, hp: number): CombatantInstance {
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

export function testEnemy(id: string, label: string, hp: number): CombatantInstance {
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

/** Wizard c-0-0, orc c-2-2; orc cell only has heavy obscurement (occupant not perceivable from outside). */
export function encounterAttackerOutsideDefenderHeavilyObscured(): EncounterState {
  const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
  const wiz = testPc('wiz', 'Wizard', 20)
  const orc = testEnemy('orc', 'Orc', 20)
  const base = createEncounterState([wiz, orc], { rng: () => 0.5, space })
  return {
    ...base,
    placements: [
      { combatantId: 'wiz', cellId: 'c-0-0' },
      { combatantId: 'orc', cellId: 'c-2-2' },
    ],
    environmentZones: [
      {
        id: 'z-heavy',
        kind: 'patch',
        sourceKind: 'manual',
        area: { kind: 'grid-cell-ids', cellIds: ['c-2-2'] },
        overrides: { visibilityObscured: 'heavy' },
      },
    ],
  }
}

/** Wizard c-0-0, orc c-2-2; orc cell only has magical darkness (same occupant masking as heavy obscurement for outside viewer). */
export function encounterAttackerOutsideDefenderMagicalDarknessCell(): EncounterState {
  const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
  const wiz = testPc('wiz', 'Wizard', 20)
  const orc = testEnemy('orc', 'Orc', 20)
  const base = createEncounterState([wiz, orc], { rng: () => 0.5, space })
  return {
    ...base,
    placements: [
      { combatantId: 'wiz', cellId: 'c-0-0' },
      { combatantId: 'orc', cellId: 'c-2-2' },
    ],
    environmentZones: [
      {
        id: 'z-md',
        kind: 'patch',
        sourceKind: 'manual',
        area: { kind: 'grid-cell-ids', cellIds: ['c-2-2'] },
        overrides: { lightingLevel: 'darkness', visibilityObscured: 'heavy' },
        magical: { magical: true, magicalDarkness: true, blocksDarkvision: true },
      },
    ],
  }
}
