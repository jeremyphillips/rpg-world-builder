import { describe, expect, it } from 'vitest'

import { createEncounterState } from '@/features/mechanics/domain/encounter/state'
import { createCombatant } from '@/features/mechanics/domain/encounter/tests/action-resolution.test-helpers'
import { createSquareGridSpace } from '@/features/encounter/space/createSquareGridSpace'

import { deriveEncounterPresentationGridPerceptionInput } from './derive-encounter-presentation-grid-perception'

function twoCombatantEncounter() {
  const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
  return createEncounterState(
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
}

describe('deriveEncounterPresentationGridPerceptionInput', () => {
  it('active-combatant mode uses activeCombatantId as viewer', () => {
    const s = twoCombatantEncounter()
    const withTurn = { ...s, activeCombatantId: 'orc', initiativeOrder: ['orc', 'wiz'] }
    const out = deriveEncounterPresentationGridPerceptionInput({
      encounterState: withTurn,
      simulatorViewerMode: 'active-combatant',
      activeCombatantId: 'orc',
      presentationSelectedCombatantId: 'wiz',
    })
    expect(out).toEqual({ viewerCombatantId: 'orc', viewerRole: 'pc' })
  })

  it('active-combatant mode ignores invalid active id', () => {
    const s = twoCombatantEncounter()
    const out = deriveEncounterPresentationGridPerceptionInput({
      encounterState: { ...s, activeCombatantId: 'missing', initiativeOrder: ['wiz', 'orc'] },
      simulatorViewerMode: 'active-combatant',
      activeCombatantId: 'missing',
      presentationSelectedCombatantId: null,
    })
    expect(out).toBeUndefined()
  })

  it('dm mode uses omniscient viewer role and prefers active combatant for anchor id', () => {
    const s = twoCombatantEncounter()
    const withTurn = { ...s, activeCombatantId: 'wiz', initiativeOrder: ['wiz', 'orc'] }
    const out = deriveEncounterPresentationGridPerceptionInput({
      encounterState: withTurn,
      simulatorViewerMode: 'dm',
      activeCombatantId: 'wiz',
      presentationSelectedCombatantId: null,
    })
    expect(out).toEqual({ viewerCombatantId: 'wiz', viewerRole: 'dm' })
  })

  it('dm mode falls back to presentation selection then initiative when active missing', () => {
    const s = twoCombatantEncounter()
    const withOrder = { ...s, activeCombatantId: null, initiativeOrder: ['orc', 'wiz'] }
    const a = deriveEncounterPresentationGridPerceptionInput({
      encounterState: withOrder,
      simulatorViewerMode: 'dm',
      activeCombatantId: null,
      presentationSelectedCombatantId: 'wiz',
    })
    expect(a).toEqual({ viewerCombatantId: 'wiz', viewerRole: 'dm' })

    const b = deriveEncounterPresentationGridPerceptionInput({
      encounterState: withOrder,
      simulatorViewerMode: 'dm',
      activeCombatantId: null,
      presentationSelectedCombatantId: null,
    })
    expect(b).toEqual({ viewerCombatantId: 'orc', viewerRole: 'dm' })
  })

  it('selected-combatant mode uses presentation id when valid', () => {
    const s = twoCombatantEncounter()
    const withTurn = { ...s, activeCombatantId: 'orc', initiativeOrder: ['orc', 'wiz'] }
    const out = deriveEncounterPresentationGridPerceptionInput({
      encounterState: withTurn,
      simulatorViewerMode: 'selected-combatant',
      activeCombatantId: 'orc',
      presentationSelectedCombatantId: 'wiz',
    })
    expect(out).toEqual({ viewerCombatantId: 'wiz', viewerRole: 'pc' })
  })

  it('selected-combatant mode falls back to active when selection missing or invalid', () => {
    const s = twoCombatantEncounter()
    const withTurn = { ...s, activeCombatantId: 'orc', initiativeOrder: ['orc', 'wiz'] }
    const missing = deriveEncounterPresentationGridPerceptionInput({
      encounterState: withTurn,
      simulatorViewerMode: 'selected-combatant',
      activeCombatantId: 'orc',
      presentationSelectedCombatantId: null,
    })
    expect(missing).toEqual({ viewerCombatantId: 'orc', viewerRole: 'pc' })

    const invalid = deriveEncounterPresentationGridPerceptionInput({
      encounterState: withTurn,
      simulatorViewerMode: 'selected-combatant',
      activeCombatantId: 'orc',
      presentationSelectedCombatantId: 'ghost',
    })
    expect(invalid).toEqual({ viewerCombatantId: 'orc', viewerRole: 'pc' })
  })

  it('returns undefined when encounter state is null', () => {
    expect(
      deriveEncounterPresentationGridPerceptionInput({
        encounterState: null,
        simulatorViewerMode: 'active-combatant',
        activeCombatantId: 'a',
        presentationSelectedCombatantId: null,
      }),
    ).toBeUndefined()
  })
})
