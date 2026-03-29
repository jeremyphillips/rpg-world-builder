import { createSquareGridSpace } from '@/features/encounter/space/creation/createSquareGridSpace'
import { DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE } from '@/features/mechanics/domain/environment/environment.resolve'

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

/** Party combatant with darkvision 120 ft from `senses.special` (matches monster stat block shape). */
export function testPcWithDarkvision120(id: string, label: string, hp: number): CombatantInstance {
  return {
    ...testPc(id, label, hp),
    senses: { special: [{ type: 'darkvision', range: 120 }] },
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
/** Global ordinary darkness; wizard c-0-0, orc c-2-2 (10 ft on 5 ft grid). */
export function encounterDarknessWizard10ftFromOrc(): EncounterState {
  const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
  const wiz = testPcWithDarkvision120('wiz', 'Wizard', 20)
  const orc = testEnemy('orc', 'Orc', 20)
  const base = createEncounterState([wiz, orc], { rng: () => 0.5, space })
  return {
    ...base,
    environmentBaseline: { ...DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE, lightingLevel: 'darkness' },
    placements: [
      { combatantId: 'wiz', cellId: 'c-0-0' },
      { combatantId: 'orc', cellId: 'c-2-2' },
    ],
  }
}

/** Same as {@link encounterDarknessWizard10ftFromOrc} but orc is 125 ft away (out of 120 ft darkvision). */
export function encounterDarknessWizardOutOfDarkvisionRange(): EncounterState {
  const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 30, rows: 8 })
  const wiz = testPcWithDarkvision120('wiz', 'Wizard', 20)
  const orc = testEnemy('orc', 'Orc', 20)
  const base = createEncounterState([wiz, orc], { rng: () => 0.5, space })
  return {
    ...base,
    environmentBaseline: { ...DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE, lightingLevel: 'darkness' },
    placements: [
      { combatantId: 'wiz', cellId: 'c-0-0' },
      { combatantId: 'orc', cellId: 'c-25-0' },
    ],
  }
}

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

/** Heavy obscurement on orc cell; viewer has darkvision — fog still blocks (same geometry as heavily obscured fixture). */
export function encounterHeavyObscuredWithDarkvisionViewer(): EncounterState {
  const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
  const wiz = testPcWithDarkvision120('wiz', 'Wizard', 20)
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

/** Magical darkness on orc cell; viewer has darkvision — still blocked. */
export function encounterMagicalDarknessWithDarkvisionViewer(): EncounterState {
  const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
  const wiz = testPcWithDarkvision120('wiz', 'Wizard', 20)
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
