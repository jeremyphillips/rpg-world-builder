import { describe, expect, it } from 'vitest'

import { createSquareGridSpace } from '@/features/encounter/space/creation/createSquareGridSpace'
import { createEncounterState } from '@/features/mechanics/domain/encounter/state'
import { createCombatant } from '@/features/mechanics/domain/encounter/tests/action-resolution.test-helpers'

import { selectGridViewModel } from '../../selectors/space.selectors'

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
    const grid = selectGridViewModel(state, {
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
})
