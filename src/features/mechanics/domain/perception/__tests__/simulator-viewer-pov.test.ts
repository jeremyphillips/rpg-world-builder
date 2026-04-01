import { describe, expect, it } from 'vitest'

import { createSquareGridSpace } from '@/features/mechanics/domain/combat/space/creation/createSquareGridSpace'

import {
  buildGridPerceptionSlice,
  mergeGridPerceptionInputCapabilities,
} from '@/features/mechanics/domain/perception/perception.render.projection'
import type { EncounterState } from '@/features/mechanics/domain/combat/state/types/encounter-state.types'

function baseEncounter(overrides: Partial<EncounterState> = {}): EncounterState {
  const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
  return {
    combatantsById: {},
    partyCombatantIds: [],
    enemyCombatantIds: [],
    initiative: [],
    initiativeOrder: [],
    activeCombatantId: 'wiz',
    turnIndex: 0,
    roundNumber: 1,
    started: true,
    log: [],
    space,
    placements: [{ combatantId: 'wiz', cellId: 'c-2-2' }],
    environmentZones: [
      {
        id: 'z-md',
        kind: 'patch',
        sourceKind: 'manual',
        area: { kind: 'sphere-ft', originCellId: 'c-2-2', radiusFt: 30 },
        overrides: { lightingLevel: 'darkness', visibilityObscured: 'heavy' },
        magical: { magical: true, magicalDarkness: true, blocksDarkvision: true },
      },
    ],
    ...overrides,
  }
}

describe('mergeGridPerceptionInputCapabilities', () => {
  it('merges debug bypass flags into capabilities', () => {
    const merged = mergeGridPerceptionInputCapabilities({
      viewerCombatantId: 'a',
      viewerRole: 'pc',
      capabilities: { darkvisionRangeFt: 60 },
      debugOverrides: { forceMagicalDarknessBypass: true },
    })
    expect(merged?.magicalDarknessBypass).toBe(true)
    expect(merged?.darkvisionRangeFt).toBe(60)
  })

  it('treats ignoreMagicalDarkness as bypass for sight (scaffold)', () => {
    const merged = mergeGridPerceptionInputCapabilities({
      viewerCombatantId: 'a',
      viewerRole: 'pc',
      debugOverrides: { ignoreMagicalDarkness: true },
    })
    expect(merged?.magicalDarknessBypass).toBe(true)
  })
})

describe('buildGridPerceptionSlice — viewer POV', () => {
  it('uses active combatant cell as viewer; PC role triggers blind veil inside magical darkness', () => {
    const state = baseEncounter()
    const slice = buildGridPerceptionSlice(state, {
      viewerCombatantId: 'wiz',
      viewerRole: 'pc',
    })
    expect(slice?.viewerCellId).toBe('c-2-2')
    expect(slice?.battlefieldRender.useBlindVeil).toBe(true)
  })

  it('DM viewer mode bypasses blind veil for the same world state', () => {
    const state = baseEncounter()
    const slice = buildGridPerceptionSlice(state, {
      viewerCombatantId: 'wiz',
      viewerRole: 'dm',
    })
    expect(slice?.battlefieldRender.useBlindVeil).toBe(false)
  })

  it('debug override removes blind veil without stat-based capabilities', () => {
    const state = baseEncounter()
    const slice = buildGridPerceptionSlice(state, {
      viewerCombatantId: 'wiz',
      viewerRole: 'pc',
      debugOverrides: { ignoreMagicalDarkness: true },
    })
    expect(slice?.battlefieldRender.useBlindVeil).toBe(false)
  })

  it('changing viewer combatant changes viewer cell and battlefield flags', () => {
    const state = baseEncounter({
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-7-7' },
      ],
      environmentZones: [
        {
          id: 'z-md',
          kind: 'patch',
          sourceKind: 'manual',
          area: { kind: 'sphere-ft', originCellId: 'c-0-0', radiusFt: 15 },
          overrides: { lightingLevel: 'darkness', visibilityObscured: 'heavy' },
          magical: { magical: true, magicalDarkness: true, blocksDarkvision: true },
        },
      ],
    })
    const inDark = buildGridPerceptionSlice(state, {
      viewerCombatantId: 'wiz',
      viewerRole: 'pc',
    })
    const outside = buildGridPerceptionSlice(state, {
      viewerCombatantId: 'orc',
      viewerRole: 'pc',
    })
    expect(inDark?.viewerCellId).toBe('c-0-0')
    expect(inDark?.battlefieldRender.useBlindVeil).toBe(true)
    expect(outside?.viewerCellId).toBe('c-7-7')
    expect(outside?.battlefieldRender.useBlindVeil).toBe(false)
  })

  it('heavy obscurement without MD suppresses AoE boundary but does not use full-grid blind veil', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const state: EncounterState = {
      combatantsById: {},
      partyCombatantIds: [],
      enemyCombatantIds: [],
      initiative: [],
      initiativeOrder: [],
      activeCombatantId: 'wiz',
      turnIndex: 0,
      roundNumber: 1,
      started: true,
      log: [],
      space,
      placements: [{ combatantId: 'wiz', cellId: 'c-2-2' }],
      environmentZones: [
        {
          id: 'z-fog',
          kind: 'patch',
          sourceKind: 'manual',
          area: { kind: 'grid-cell-ids', cellIds: ['c-2-2'] },
          overrides: { visibilityObscured: 'heavy' },
        },
      ],
    }
    const slice = buildGridPerceptionSlice(state, {
      viewerCombatantId: 'wiz',
      viewerRole: 'pc',
    })
    expect(slice?.battlefieldRender.useBlindVeil).toBe(false)
    expect(slice?.battlefieldRender.blindVeilOpacity).toBe(0)
    expect(slice?.battlefieldRender.suppressDarknessBoundaryFromInside).toBe(true)
    expect(slice?.battlefieldRender.suppressAoeTemplateOverlay).toBe(true)
  })
})
