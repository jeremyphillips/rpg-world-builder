import { describe, expect, it } from 'vitest'

import { createSquareGridSpace } from '@/features/encounter/space/creation/createSquareGridSpace'
import { createEncounterState } from '@/features/mechanics/domain/encounter/state'
import { createCombatant } from '@/features/mechanics/domain/encounter/tests/action-resolution.test-helpers'

import {
  buildCombatantViewerPresentationKindById,
  deriveViewerCombatantPresentationKind,
  shouldRenderOccupantTokenForEncounterViewer,
} from '../../rendering/grid-occupant-render-visibility'

function baseGridState() {
  const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
  return createEncounterState(
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
        passivePerception: 10,
      }),
      createCombatant({
        instanceId: 'ally',
        label: 'Ally',
        side: 'party',
        initiativeModifier: 0,
        dexterityScore: 12,
        armorClass: 12,
        passivePerception: 10,
      }),
    ],
    { rng: () => 0.5, space },
  )
}

describe('deriveViewerCombatantPresentationKind', () => {
  it('classifies non-perception as out-of-sight (invisible target)', () => {
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
    const withGrid = {
      ...s,
      placements: [
        { combatantId: 'orc', cellId: 'c-2-2' },
        { combatantId: 'wiz', cellId: 'c-0-0' },
      ],
    }
    expect(
      deriveViewerCombatantPresentationKind(withGrid, {
        viewerCombatantId: 'wiz',
        viewerRole: 'pc',
        occupantCombatantId: 'orc',
      }),
    ).toBe('out-of-sight')
  })

  it('classifies stale hidden-from-observer as hidden when pair perception passes', () => {
    const s = baseGridState()
    const withStealth = {
      ...s,
      combatantsById: {
        ...s.combatantsById,
        orc: {
          ...s.combatantsById.orc!,
          stealth: { hiddenFromObserverIds: ['wiz'] },
        },
      },
      placements: [
        { combatantId: 'orc', cellId: 'c-2-2' },
        { combatantId: 'wiz', cellId: 'c-0-0' },
      ],
    }
    expect(
      deriveViewerCombatantPresentationKind(withStealth, {
        viewerCombatantId: 'wiz',
        viewerRole: 'pc',
        occupantCombatantId: 'orc',
      }),
    ).toBe('hidden')
  })

  it('prefers hidden over out-of-sight when stealth lists observer even if pair perception fails', () => {
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
    const withGrid = {
      ...s,
      placements: [
        { combatantId: 'orc', cellId: 'c-2-2' },
        { combatantId: 'wiz', cellId: 'c-0-0' },
      ],
    }
    expect(
      deriveViewerCombatantPresentationKind(withGrid, {
        viewerCombatantId: 'wiz',
        viewerRole: 'pc',
        occupantCombatantId: 'orc',
      }),
    ).toBe('hidden')
  })
})

describe('shouldRenderOccupantTokenForEncounterViewer', () => {
  it('DM viewer always renders occupant tokens', () => {
    const s = baseGridState()
    const withGrid = {
      ...s,
      placements: [
        { combatantId: 'orc', cellId: 'c-2-2' },
        { combatantId: 'wiz', cellId: 'c-0-0' },
      ],
    }
    expect(
      shouldRenderOccupantTokenForEncounterViewer(withGrid, {
        viewerCombatantId: 'wiz',
        viewerRole: 'dm',
        occupantCombatantId: 'orc',
      }),
    ).toBe(true)
  })

  it('PC viewer always renders own token', () => {
    const s = baseGridState()
    const withGrid = {
      ...s,
      placements: [
        { combatantId: 'orc', cellId: 'c-2-2' },
        { combatantId: 'wiz', cellId: 'c-0-0' },
      ],
    }
    expect(
      shouldRenderOccupantTokenForEncounterViewer(withGrid, {
        viewerCombatantId: 'wiz',
        viewerRole: 'pc',
        occupantCombatantId: 'wiz',
      }),
    ).toBe(true)
  })

  it('suppresses token when observer cannot perceive occupant (invisible target)', () => {
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
    const withGrid = {
      ...s,
      placements: [
        { combatantId: 'orc', cellId: 'c-2-2' },
        { combatantId: 'wiz', cellId: 'c-0-0' },
      ],
    }
    expect(
      shouldRenderOccupantTokenForEncounterViewer(withGrid, {
        viewerCombatantId: 'wiz',
        viewerRole: 'pc',
        occupantCombatantId: 'orc',
      }),
    ).toBe(false)
  })

  it('suppresses when hidden from observer while occupant is perceivable (stale bookkeeping)', () => {
    const s = baseGridState()
    const withStealth = {
      ...s,
      combatantsById: {
        ...s.combatantsById,
        orc: {
          ...s.combatantsById.orc!,
          stealth: { hiddenFromObserverIds: ['wiz'] },
        },
      },
      placements: [
        { combatantId: 'orc', cellId: 'c-2-2' },
        { combatantId: 'wiz', cellId: 'c-0-0' },
      ],
    }
    expect(
      shouldRenderOccupantTokenForEncounterViewer(withStealth, {
        viewerCombatantId: 'wiz',
        viewerRole: 'pc',
        occupantCombatantId: 'orc',
      }),
    ).toBe(false)
  })

  it('preserves observer-relative hidden: other observer still renders when not in hidden list', () => {
    const s = baseGridState()
    const withStealth = {
      ...s,
      combatantsById: {
        ...s.combatantsById,
        orc: {
          ...s.combatantsById.orc!,
          stealth: { hiddenFromObserverIds: ['wiz'] },
        },
      },
      placements: [
        { combatantId: 'orc', cellId: 'c-2-2' },
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'ally', cellId: 'c-1-0' },
      ],
    }
    expect(
      shouldRenderOccupantTokenForEncounterViewer(withStealth, {
        viewerCombatantId: 'ally',
        viewerRole: 'pc',
        occupantCombatantId: 'orc',
      }),
    ).toBe(true)
  })
})

describe('buildCombatantViewerPresentationKindById', () => {
  it('marks all visible when perception input omitted', () => {
    const s = baseGridState()
    const withGrid = {
      ...s,
      placements: [
        { combatantId: 'orc', cellId: 'c-2-2' },
        { combatantId: 'wiz', cellId: 'c-0-0' },
      ],
    }
    const map = buildCombatantViewerPresentationKindById(withGrid, undefined, ['orc', 'wiz'])
    expect(map.orc).toBe('visible')
    expect(map.wiz).toBe('visible')
  })

  it('DM input leaves everyone visible', () => {
    const s = baseGridState()
    const withStealth = {
      ...s,
      combatantsById: {
        ...s.combatantsById,
        orc: {
          ...s.combatantsById.orc!,
          stealth: { hiddenFromObserverIds: ['wiz'] },
        },
      },
      placements: [
        { combatantId: 'orc', cellId: 'c-2-2' },
        { combatantId: 'wiz', cellId: 'c-0-0' },
      ],
    }
    const map = buildCombatantViewerPresentationKindById(
      withStealth,
      { viewerCombatantId: 'wiz', viewerRole: 'dm' },
      ['orc', 'wiz'],
    )
    expect(map.orc).toBe('visible')
  })

  it('PC viewer gets hidden for stealth-only blocked subject when pair perception passes', () => {
    const s = baseGridState()
    const withStealth = {
      ...s,
      combatantsById: {
        ...s.combatantsById,
        orc: {
          ...s.combatantsById.orc!,
          stealth: { hiddenFromObserverIds: ['wiz'] },
        },
      },
      placements: [
        { combatantId: 'orc', cellId: 'c-2-2' },
        { combatantId: 'wiz', cellId: 'c-0-0' },
      ],
    }
    const map = buildCombatantViewerPresentationKindById(
      withStealth,
      { viewerCombatantId: 'wiz', viewerRole: 'pc' },
      ['orc', 'wiz'],
    )
    expect(map.orc).toBe('hidden')
    expect(map.wiz).toBe('visible')
  })
})
