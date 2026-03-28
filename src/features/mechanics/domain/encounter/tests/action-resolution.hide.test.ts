import { describe, expect, it } from 'vitest'

import { createSquareGridSpace } from '@/features/encounter/space/creation/createSquareGridSpace'
import { getCombatantTurnResources } from '../resolution/action/action-cost'
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
    expect(last?.details).toContain('Beat passive Perception: Wizard')
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

  it('does not roll Stealth when no observer passes hide eligibility (open ground)', () => {
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
    }

    const resolved = resolveCombatAction(
      withPlacements,
      { actorId: 'orc', actionId: 'hide' },
      { rng: () => 0.99 },
    )

    expect(resolved.combatantsById.orc?.stealth).toBeUndefined()
    const last = resolved.log[resolved.log.length - 1]
    expect(last?.details).toContain('No Stealth roll')
  })

  it('partial success: hidden only from observers whose passive Perception was beaten (strict >)', () => {
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
          actions: [
            {
              ...DEFAULT_HIDE_COMBAT_ACTION,
              id: 'hide',
              hideProfile: { stealthModifier: 5 },
            },
          ],
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
          dexterityScore: 10,
          armorClass: 14,
          passivePerception: 20,
        }),
      ],
      { rng: () => 0.5, space },
    )
    const withPlacements = {
      ...state,
      activeCombatantId: 'orc',
      initiativeOrder: ['orc', 'wiz', 'ally'],
      placements: [
        { combatantId: 'orc', cellId: 'c-2-2' },
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'ally', cellId: 'c-4-0' },
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

    // d20 10 + mod 5 = 15: beats PP 10, loses to PP 20
    const resolved = resolveCombatAction(withPlacements, { actorId: 'orc', actionId: 'hide' }, { rng: () => 0.45 })

    expect(resolved.combatantsById.orc?.stealth?.hiddenFromObserverIds?.sort()).toEqual(['wiz'])
    expect(resolved.combatantsById.orc?.stealth?.hiddenFromObserverIds).not.toContain('ally')
    const last = resolved.log[resolved.log.length - 1]
    expect(last?.details).toContain('Beat passive Perception: Wizard')
    expect(last?.details).toContain('Did not beat: Ally')
  })

  it('consumes the standard Action resource when Hide resolves', () => {
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

    expect(getCombatantTurnResources(withPlacements.combatantsById.orc!).actionAvailable).toBe(true)

    const resolved = resolveCombatAction(
      withPlacements,
      { actorId: 'orc', actionId: 'hide' },
      { rng: () => 0.96 },
    )

    expect(getCombatantTurnResources(resolved.combatantsById.orc!).actionAvailable).toBe(false)
  })
})
