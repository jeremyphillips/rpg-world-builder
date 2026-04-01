import { describe, expect, it } from 'vitest'

import { deriveEncounterPresentationGridPerceptionInput } from '@/features/mechanics/domain/combat/presentation/perception/derive-encounter-presentation-grid-perception'
import {
  encounterBlindsightOrdinaryDarkness10ftFromOrc,
  encounterBlindsightOutOfRangeHeavyObscuredInDarkvisionRange,
  encounterDarknessWizard10ftFromOrc,
  encounterDarknessWizardOutOfDarkvisionRange,
  encounterHeavyObscuredWithBlindsightViewer,
} from '@/features/mechanics/domain/combat/tests/encounter-visibility-test-fixtures'
import { createSquareGridSpace } from '@/features/mechanics/domain/combat/space/creation/createSquareGridSpace'
import { createEncounterState } from '@/features/mechanics/domain/combat/state'
import { createCombatant } from '@/features/mechanics/domain/combat/tests/action-resolution.test-helpers'

import { selectGridViewModel } from '@/features/mechanics/domain/combat/space/selectors/space.selectors'
import { asEncounterState } from '@/features/mechanics/domain/combat/tests/encounter-test-state'

describe('selectGridViewModel — viewerPerceivesOccupantToken', () => {
  it('sets viewerPerceivesOccupantToken false on occupant cell when viewer cannot perceive (invisible)', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const s = createEncounterState(
      [
        createCombatant({
          instanceId: 'orc',
          label: 'Orc',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 10,
          armorClass: 12,
          conditions: [{ label: 'invisible' }],
        }),
        createCombatant({
          instanceId: 'wiz',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 2,
          dexterityScore: 14,
          armorClass: 14,
        }),
      ],
      { rng: () => 0.5, space },
    )
    const state = {
      ...s,
      placements: [
        { combatantId: 'orc', cellId: 'c-2-2' },
        { combatantId: 'wiz', cellId: 'c-0-0' },
      ],
    }
    const grid = selectGridViewModel(state, {
      perception: { viewerCombatantId: 'wiz', viewerRole: 'pc' },
    })
    const orcCell = grid?.cells.find((c) => c.occupantId === 'orc')
    expect(orcCell?.viewerPerceivesOccupantToken).toBe(false)
    expect(orcCell?.viewerOccupantPresentationKind).toBe('out-of-sight')
    const wizCell = grid?.cells.find((c) => c.occupantId === 'wiz')
    expect(wizCell?.viewerPerceivesOccupantToken).toBe(true)
    expect(wizCell?.viewerOccupantPresentationKind).toBe('visible')
  })

  it('surfaces hidden presentation when stealth lists observer even if occupant is also not perceivable', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const s = createEncounterState(
      [
        createCombatant({
          instanceId: 'orc',
          label: 'Orc',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 10,
          armorClass: 12,
          conditions: [{ label: 'invisible' }],
          stealth: { hiddenFromObserverIds: ['wiz'] },
        }),
        createCombatant({
          instanceId: 'wiz',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 2,
          dexterityScore: 14,
          armorClass: 14,
        }),
      ],
      { rng: () => 0.5, space },
    )
    const state = {
      ...s,
      placements: [
        { combatantId: 'orc', cellId: 'c-2-2' },
        { combatantId: 'wiz', cellId: 'c-0-0' },
      ],
    }
    const grid = selectGridViewModel(state, {
      perception: { viewerCombatantId: 'wiz', viewerRole: 'pc' },
    })
    const orcCell = grid?.cells.find((c) => c.occupantId === 'orc')
    expect(orcCell?.viewerPerceivesOccupantToken).toBe(false)
    expect(orcCell?.viewerOccupantPresentationKind).toBe('hidden')
  })

  it('DM perception leaves viewerPerceivesOccupantToken true for all occupied cells', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const s = createEncounterState(
      [
        createCombatant({
          instanceId: 'orc',
          label: 'Orc',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 10,
          armorClass: 12,
          conditions: [{ label: 'invisible' }],
        }),
        createCombatant({
          instanceId: 'wiz',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 2,
          dexterityScore: 14,
          armorClass: 14,
        }),
      ],
      { rng: () => 0.5, space },
    )
    const state = {
      ...s,
      placements: [
        { combatantId: 'orc', cellId: 'c-2-2' },
        { combatantId: 'wiz', cellId: 'c-0-0' },
      ],
    }
    const grid = selectGridViewModel(state, {
      perception: { viewerCombatantId: 'wiz', viewerRole: 'dm' },
    })
    const orcCell = grid?.cells.find((c) => c.occupantId === 'orc')
    expect(orcCell?.viewerPerceivesOccupantToken).toBe(true)
    expect(orcCell?.viewerOccupantPresentationKind).toBe('visible')
    expect(orcCell?.perception?.occupantTokenVisibility).toBe('all')
  })

  it('does not set viewerPerceivesOccupantToken when perception opts omitted', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const s = createEncounterState(
      [
        createCombatant({
          instanceId: 'orc',
          label: 'Orc',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 10,
          armorClass: 12,
        }),
        createCombatant({
          instanceId: 'wiz',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 2,
          dexterityScore: 14,
          armorClass: 14,
        }),
      ],
      { rng: () => 0.5, space },
    )
    const state = {
      ...s,
      placements: [
        { combatantId: 'orc', cellId: 'c-2-2' },
        { combatantId: 'wiz', cellId: 'c-0-0' },
      ],
    }
    const grid = selectGridViewModel(state, {})
    const orcCell = grid?.cells.find((c) => c.occupantId === 'orc')
    expect(orcCell?.viewerPerceivesOccupantToken).toBeUndefined()
  })

  it('keeps combatants in view model when token suppressed (state unchanged)', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const s = createEncounterState(
      [
        createCombatant({
          instanceId: 'orc',
          label: 'Orc',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 10,
          armorClass: 12,
          conditions: [{ label: 'invisible' }],
        }),
        createCombatant({
          instanceId: 'wiz',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 2,
          dexterityScore: 14,
          armorClass: 14,
        }),
      ],
      { rng: () => 0.5, space },
    )
    const state = {
      ...s,
      placements: [
        { combatantId: 'orc', cellId: 'c-2-2' },
        { combatantId: 'wiz', cellId: 'c-0-0' },
      ],
    }
    const grid = selectGridViewModel(state, {
      perception: { viewerCombatantId: 'wiz', viewerRole: 'pc' },
    })
    const orcCell = grid?.cells.find((c) => c.cellId === 'c-2-2')
    expect(orcCell?.occupantId).toBe('orc')
    expect(orcCell?.occupantLabel).toBeTruthy()
    expect(orcCell?.viewerPerceivesOccupantToken).toBe(false)
    expect(orcCell?.viewerOccupantPresentationKind).toBe('out-of-sight')
  })

  it('heavy obscurement on target: cell perception and pair seam both suppress distant occupant token', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const s = createEncounterState(
      [
        createCombatant({
          instanceId: 'a',
          label: 'A',
          side: 'party',
          initiativeModifier: 1,
          dexterityScore: 10,
          armorClass: 12,
        }),
        createCombatant({
          instanceId: 'b',
          label: 'B',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 10,
          armorClass: 12,
        }),
      ],
      { rng: () => 0.5, space },
    )
    const state = {
      ...s,
      placements: [
        { combatantId: 'a', cellId: 'c-0-0' },
        { combatantId: 'b', cellId: 'c-3-3' },
      ],
      environmentZones: [
        {
          id: 'z-heavy',
          kind: 'patch',
          sourceKind: 'manual',
          area: { kind: 'grid-cell-ids', cellIds: ['c-3-3'] },
          overrides: { visibilityObscured: 'heavy' },
        },
      ],
    }
    const grid = selectGridViewModel(asEncounterState(state), {
      perception: { viewerCombatantId: 'a', viewerRole: 'pc' },
    })
    const selfCell = grid?.cells.find((c) => c.cellId === 'c-0-0')
    const obscuredCell = grid?.cells.find((c) => c.cellId === 'c-3-3')
    expect(selfCell?.perception?.occupantTokenVisibility).toBe('all')
    expect(selfCell?.viewerPerceivesOccupantToken).toBe(true)
    expect(obscuredCell?.perception?.occupantTokenVisibility).toBe('none')
    expect(obscuredCell?.viewerPerceivesOccupantToken).toBe(false)
    expect(obscuredCell?.viewerOccupantPresentationKind).toBe('out-of-sight')
  })

  it('suppresses synced persistent aura fill when PC viewer is immersed in heavy obscurement (no footprint ring)', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const s = createEncounterState(
      [
        createCombatant({
          instanceId: 'wiz',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 2,
          dexterityScore: 14,
          armorClass: 14,
        }),
      ],
      { rng: () => 0.5, space },
    )
    const state = {
      ...s,
      activeCombatantId: 'wiz',
      placements: [{ combatantId: 'wiz', cellId: 'c-2-2' }],
      environmentZones: [
        {
          id: 'z-fog',
          kind: 'patch',
          sourceKind: 'manual',
          area: { kind: 'sphere-ft', originCellId: 'c-2-2', radiusFt: 20 },
          overrides: { visibilityObscured: 'heavy' },
        },
      ],
    }
    const grid = selectGridViewModel(asEncounterState(state), {
      perception: { viewerCombatantId: 'wiz', viewerRole: 'pc' },
      persistentAttachedAuras: [{ originCellId: 'c-2-2', areaRadiusFt: 20 }],
    })
    const viewerCell = grid?.cells.find((c) => c.cellId === 'c-2-2')
    const neighborInFootprint = grid?.cells.find((c) => c.cellId === 'c-3-2')
    expect(viewerCell?.persistentAttachedAura).toBeUndefined()
    expect(neighborInFootprint?.persistentAttachedAura).toBeUndefined()
    expect(grid?.perception?.battlefieldRender.suppressAoeTemplateOverlay).toBe(true)
  })

  it('still shows persistent aura footprint for PC viewer outside the obscuring volume', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const s = createEncounterState(
      [
        createCombatant({
          instanceId: 'wiz',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 2,
          dexterityScore: 14,
          armorClass: 14,
        }),
        createCombatant({
          instanceId: 'orc',
          label: 'Orc',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 10,
          armorClass: 12,
        }),
      ],
      { rng: () => 0.5, space },
    )
    const state = {
      ...s,
      placements: [
        { combatantId: 'wiz', cellId: 'c-2-2' },
        { combatantId: 'orc', cellId: 'c-7-7' },
      ],
      environmentZones: [
        {
          id: 'z-fog',
          kind: 'patch',
          sourceKind: 'manual',
          area: { kind: 'sphere-ft', originCellId: 'c-2-2', radiusFt: 20 },
          overrides: { visibilityObscured: 'heavy' },
        },
      ],
    }
    const grid = selectGridViewModel(asEncounterState(state), {
      perception: { viewerCombatantId: 'orc', viewerRole: 'pc' },
      persistentAttachedAuras: [{ originCellId: 'c-2-2', areaRadiusFt: 20 }],
    })
    const cellInFog = grid?.cells.find((c) => c.cellId === 'c-2-2')
    expect(cellInFog?.persistentAttachedAura).toBe(true)
    expect(grid?.perception?.battlefieldRender.suppressAoeTemplateOverlay).toBe(false)
  })
})

describe('selectGridViewModel — immersed obscuration footprint suppression (hardening)', () => {
  const fogZoneAtWizard = {
    id: 'z-fog',
    kind: 'patch' as const,
    sourceKind: 'manual' as const,
    area: { kind: 'sphere-ft' as const, originCellId: 'c-2-2', radiusFt: 20 },
    overrides: { visibilityObscured: 'heavy' as const },
    visibilityObscurationCause: 'fog' as const,
  }

  const mdZoneAtWizard = {
    id: 'z-md',
    kind: 'patch' as const,
    sourceKind: 'manual' as const,
    area: { kind: 'sphere-ft' as const, originCellId: 'c-2-2', radiusFt: 30 },
    overrides: { lightingLevel: 'darkness' as const, visibilityObscured: 'heavy' as const },
    magical: { magical: true, magicalDarkness: true, blocksDarkvision: true },
  }

  it('PC inside magical darkness: suppress footprint overlay; blind veil; no persistentAttachedAura', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const s = createEncounterState(
      [
        createCombatant({
          instanceId: 'wiz',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 2,
          dexterityScore: 14,
          armorClass: 14,
        }),
      ],
      { rng: () => 0.5, space },
    )
    const state = {
      ...s,
      activeCombatantId: 'wiz',
      placements: [{ combatantId: 'wiz', cellId: 'c-2-2' }],
      environmentZones: [mdZoneAtWizard],
    }
    const grid = selectGridViewModel(state, {
      perception: { viewerCombatantId: 'wiz', viewerRole: 'pc' },
      persistentAttachedAuras: [{ originCellId: 'c-2-2', areaRadiusFt: 30 }],
    })
    expect(grid?.perception?.battlefieldRender.suppressAoeTemplateOverlay).toBe(true)
    expect(grid?.perception?.battlefieldRender.useBlindVeil).toBe(true)
    expect(grid?.cells.find((c) => c.cellId === 'c-2-2')?.persistentAttachedAura).toBeUndefined()
  })

  it('DM inside heavy fog: omniscient — footprint overlay stays on; suppression off (deliberate)', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const s = createEncounterState(
      [
        createCombatant({
          instanceId: 'wiz',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 2,
          dexterityScore: 14,
          armorClass: 14,
        }),
      ],
      { rng: () => 0.5, space },
    )
    const state = {
      ...s,
      placements: [{ combatantId: 'wiz', cellId: 'c-2-2' }],
      environmentZones: [fogZoneAtWizard],
    }
    const grid = selectGridViewModel(state, {
      perception: { viewerCombatantId: 'wiz', viewerRole: 'dm' },
      persistentAttachedAuras: [{ originCellId: 'c-2-2', areaRadiusFt: 20 }],
    })
    expect(grid?.perception?.battlefieldRender.suppressAoeTemplateOverlay).toBe(false)
    expect(grid?.cells.find((c) => c.cellId === 'c-2-2')?.persistentAttachedAura).toBe(true)
  })

  it('DM inside magical darkness: omniscient — footprint overlay stays on; suppression off', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const s = createEncounterState(
      [
        createCombatant({
          instanceId: 'wiz',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 2,
          dexterityScore: 14,
          armorClass: 14,
        }),
      ],
      { rng: () => 0.5, space },
    )
    const state = {
      ...s,
      placements: [{ combatantId: 'wiz', cellId: 'c-2-2' }],
      environmentZones: [mdZoneAtWizard],
    }
    const grid = selectGridViewModel(state, {
      perception: { viewerCombatantId: 'wiz', viewerRole: 'dm' },
      persistentAttachedAuras: [{ originCellId: 'c-2-2', areaRadiusFt: 30 }],
    })
    expect(grid?.perception?.battlefieldRender.suppressAoeTemplateOverlay).toBe(false)
    expect(grid?.cells.find((c) => c.cellId === 'c-2-2')?.persistentAttachedAura).toBe(true)
  })

  it('legacy fallback: no perception input — outside-observer; full footprint overlay; no grid.perception', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const s = createEncounterState(
      [
        createCombatant({
          instanceId: 'wiz',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 2,
          dexterityScore: 14,
          armorClass: 14,
        }),
      ],
      { rng: () => 0.5, space },
    )
    const state = {
      ...s,
      placements: [{ combatantId: 'wiz', cellId: 'c-2-2' }],
      environmentZones: [fogZoneAtWizard],
    }
    const grid = selectGridViewModel(state, {
      persistentAttachedAuras: [{ originCellId: 'c-2-2', areaRadiusFt: 20 }],
    })
    expect(grid?.perception).toBeUndefined()
    expect(grid?.cells.find((c) => c.cellId === 'c-2-2')?.persistentAttachedAura).toBe(true)
  })

  it('hybrid: immersed PC — unrevealed outside cells inherit viewer fog tint (not generic hidden black)', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const s = createEncounterState(
      [
        createCombatant({
          instanceId: 'wiz',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 2,
          dexterityScore: 14,
          armorClass: 14,
        }),
      ],
      { rng: () => 0.5, space },
    )
    const state = {
      ...s,
      placements: [{ combatantId: 'wiz', cellId: 'c-2-2' }],
      environmentZones: [fogZoneAtWizard],
    }
    const grid = selectGridViewModel(state, {
      perception: { viewerCombatantId: 'wiz', viewerRole: 'pc' },
      persistentAttachedAuras: [{ originCellId: 'c-2-2', areaRadiusFt: 20 }],
    })
    const inside = grid?.cells.find((c) => c.cellId === 'c-2-2')
    /** Chebyshev distance from c-2-2 is 5 cells (>20ft radius on 5ft grid) — outside the fog sphere. */
    const outsideClear = grid?.cells.find((c) => c.cellId === 'c-7-7')
    const insideFill = inside?.perception?.perceptionBaseFillKind
    const outsideFill = outsideClear?.perception?.perceptionBaseFillKind
    expect(insideFill).toBe('fog')
    expect(outsideFill).toBe('fog')
    expect(outsideFill).not.toBe('hidden')
  })

  it('active-combatant POV via deriveEncounterPresentationGridPerceptionInput: immersed footprint suppressed in fog', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const s = createEncounterState(
      [
        createCombatant({
          instanceId: 'wiz',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 2,
          dexterityScore: 14,
          armorClass: 14,
        }),
      ],
      { rng: () => 0.5, space },
    )
    const state = {
      ...s,
      activeCombatantId: 'wiz',
      placements: [{ combatantId: 'wiz', cellId: 'c-2-2' }],
      environmentZones: [fogZoneAtWizard],
    }
    const perception = deriveEncounterPresentationGridPerceptionInput({
      encounterState: state,
      simulatorViewerMode: 'active-combatant',
      activeCombatantId: 'wiz',
      presentationSelectedCombatantId: null,
    })
    expect(perception).toEqual({ viewerCombatantId: 'wiz', viewerRole: 'pc' })
    const grid = selectGridViewModel(state, {
      perception,
      persistentAttachedAuras: [{ originCellId: 'c-2-2', areaRadiusFt: 20 }],
    })
    expect(grid?.cells.find((c) => c.cellId === 'c-2-2')?.persistentAttachedAura).toBeUndefined()
    expect(grid?.perception?.battlefieldRender.suppressAoeTemplateOverlay).toBe(true)
  })

  it('active-combatant POV: darkvision range from viewer senses; token visible in ordinary darkness within range', () => {
    const base = encounterDarknessWizard10ftFromOrc()
    const state = { ...base, activeCombatantId: 'wiz', initiativeOrder: ['wiz', 'orc'] }
    const perception = deriveEncounterPresentationGridPerceptionInput({
      encounterState: state,
      simulatorViewerMode: 'active-combatant',
      activeCombatantId: 'wiz',
      presentationSelectedCombatantId: null,
    })
    expect(perception).toEqual({
      viewerCombatantId: 'wiz',
      viewerRole: 'pc',
      capabilities: { darkvisionRangeFt: 120 },
    })
    const grid = selectGridViewModel(state, { perception })
    const orcCell = grid?.cells.find((c) => c.occupantId === 'orc')
    expect(orcCell?.viewerPerceivesOccupantToken).toBe(true)
  })

  it('active-combatant POV: beyond darkvision range occupant token not visible in ordinary darkness', () => {
    const base = encounterDarknessWizardOutOfDarkvisionRange()
    const state = { ...base, activeCombatantId: 'wiz', initiativeOrder: ['wiz', 'orc'] }
    const perception = deriveEncounterPresentationGridPerceptionInput({
      encounterState: state,
      simulatorViewerMode: 'active-combatant',
      activeCombatantId: 'wiz',
      presentationSelectedCombatantId: null,
    })
    expect(perception?.capabilities).toEqual({ darkvisionRangeFt: 120 })
    const grid = selectGridViewModel(state, { perception })
    const orcCell = grid?.cells.find((c) => c.occupantId === 'orc')
    expect(orcCell?.viewerPerceivesOccupantToken).toBe(false)
  })

  it('active-combatant POV: blindsight + darkvision from viewer senses; token visible in ordinary darkness within blindsight', () => {
    const base = encounterBlindsightOrdinaryDarkness10ftFromOrc()
    const state = { ...base, activeCombatantId: 'wiz', initiativeOrder: ['wiz', 'orc'] }
    const perception = deriveEncounterPresentationGridPerceptionInput({
      encounterState: state,
      simulatorViewerMode: 'active-combatant',
      activeCombatantId: 'wiz',
      presentationSelectedCombatantId: null,
    })
    expect(perception?.capabilities).toEqual({
      blindsightRangeFt: 60,
      darkvisionRangeFt: 120,
    })
    const grid = selectGridViewModel(state, { perception })
    const orcCell = grid?.cells.find((c) => c.occupantId === 'orc')
    expect(orcCell?.viewerPerceivesOccupantToken).toBe(true)
  })

  it('active-combatant POV: blindsight within range — occupant visible in heavy obscurement', () => {
    const base = encounterHeavyObscuredWithBlindsightViewer()
    const state = { ...base, activeCombatantId: 'wiz', initiativeOrder: ['wiz', 'orc'] }
    const perception = deriveEncounterPresentationGridPerceptionInput({
      encounterState: state,
      simulatorViewerMode: 'active-combatant',
      activeCombatantId: 'wiz',
      presentationSelectedCombatantId: null,
    })
    const grid = selectGridViewModel(state, { perception })
    const orcCell = grid?.cells.find((c) => c.occupantId === 'orc')
    expect(orcCell?.viewerPerceivesOccupantToken).toBe(true)
  })

  it('active-combatant POV: out of blindsight, in darkvision — heavy obscurement still hides token', () => {
    const base = encounterBlindsightOutOfRangeHeavyObscuredInDarkvisionRange()
    const state = { ...base, activeCombatantId: 'wiz', initiativeOrder: ['wiz', 'orc'] }
    const perception = deriveEncounterPresentationGridPerceptionInput({
      encounterState: state,
      simulatorViewerMode: 'active-combatant',
      activeCombatantId: 'wiz',
      presentationSelectedCombatantId: null,
    })
    const grid = selectGridViewModel(state, { perception })
    const orcCell = grid?.cells.find((c) => c.occupantId === 'orc')
    expect(orcCell?.viewerPerceivesOccupantToken).toBe(false)
  })
})
