import { describe, expect, it } from 'vitest'

import { createSquareGridSpace } from '@/features/encounter/space/createSquareGridSpace'
import { DEFAULT_HIDE_COMBAT_ACTION, resolveCombatAction } from '../resolution'
import { createEncounterState } from '../state'

import { createCombatant } from './action-resolution.test-helpers'

describe('resolveCombatAction — Hide vs passive Perception', () => {
  it('rolls Stealth and marks hidden from observers beaten (strict > passive)', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'orc',
          label: 'Orc',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 10,
          armorClass: 12,
          actions: [{ ...DEFAULT_HIDE_COMBAT_ACTION, id: 'hide' }],
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
      ],
      { rng: () => 0.5, space },
    )
    const withPlacements = {
      ...state,
      activeCombatantId: 'orc',
      initiativeOrder: ['orc', 'wiz'],
      placements: [
        { combatantId: 'orc', cellId: 'c-2-2' },
        { combatantId: 'wiz', cellId: 'c-0-0' },
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

    const resolved = resolveCombatAction(
      withPlacements,
      { actorId: 'orc', actionId: 'hide' },
      {
        rng: () => 0.96,
      },
    )

    expect(resolved.combatantsById.orc?.stealth?.hiddenFromObserverIds).toContain('wiz')
    const last = resolved.log[resolved.log.length - 1]
    expect(last?.details).toContain('Stealth')
    expect(last?.details).toContain('Beat passive Perception: wiz')
  })

  it('does not hide when Stealth ties passive Perception (tie → observer wins)', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'orc',
          label: 'Orc',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 10,
          armorClass: 12,
          actions: [{ ...DEFAULT_HIDE_COMBAT_ACTION, id: 'hide', hideProfile: { stealthModifier: 9 } }],
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
      ],
      { rng: () => 0.5, space },
    )
    const withPlacements = {
      ...state,
      activeCombatantId: 'orc',
      initiativeOrder: ['orc', 'wiz'],
      placements: [
        { combatantId: 'orc', cellId: 'c-2-2' },
        { combatantId: 'wiz', cellId: 'c-0-0' },
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

    const resolved = resolveCombatAction(
      withPlacements,
      { actorId: 'orc', actionId: 'hide' },
      {
        rng: () => 0.0,
      },
    )

    expect(resolved.combatantsById.orc?.stealth).toBeUndefined()
  })
})
