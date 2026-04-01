import { describe, expect, it } from 'vitest'

import { createSquareGridSpace } from '@/features/mechanics/domain/combat/space/creation/createSquareGridSpace'

import type { EncounterState } from '@/features/mechanics/domain/combat/state/types'
import {
  applyNoiseAwarenessForSubject,
  createEncounterState,
  getGuessedCellForObserver,
  reconcileAwarenessGuessesWithPerception,
  setGuessedCellForObserver,
} from '@/features/mechanics/domain/combat/state'
import { asEncounterState } from '@/features/mechanics/domain/combat/tests/encounter-test-state'
import {
  encounterAttackerOutsideDefenderHeavilyObscured,
  testEnemy,
  testPc,
} from './encounter-visibility-test-fixtures'

describe('awareness-rules (guessed cell / sound seam)', () => {
  it('sets guessed cell for opposing observers who cannot visually perceive the subject', () => {
    const state = encounterAttackerOutsideDefenderHeavilyObscured()
    const next = applyNoiseAwarenessForSubject(state, 'orc', { kind: 'attack' })
    expect(getGuessedCellForObserver(next, 'orc', 'wiz')).toBe('c-2-2')
  })

  it('does not set guessed cell for an observer who already perceives the occupant', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const wiz = testPc('wiz', 'Wizard', 20)
    const orc = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([wiz, orc], { rng: () => 0.5, space })
    const state = {
      ...base,
      partyCombatantIds: ['wiz'],
      enemyCombatantIds: ['orc'],
      initiativeOrder: ['wiz', 'orc'],
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
    }
    const next = applyNoiseAwarenessForSubject(state, 'orc', { kind: 'other' })
    expect(getGuessedCellForObserver(next, 'orc', 'wiz')).toBeUndefined()
  })

  it('is observer-relative: each opposing combatant gets their own guess entry', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const wiz = testPc('wiz', 'Wizard', 20)
    const ally = testPc('ally', 'Ally', 20)
    const orc = testEnemy('orc', 'Orc', 20)
    const gob = testEnemy('gob', 'Goblin', 20)
    const base = createEncounterState([wiz, ally, orc, gob], { rng: () => 0.5, space })
    const state = {
      ...base,
      partyCombatantIds: ['wiz', 'ally'],
      enemyCombatantIds: ['orc', 'gob'],
      initiativeOrder: ['wiz', 'orc', 'ally', 'gob'],
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'ally', cellId: 'c-0-1' },
        { combatantId: 'orc', cellId: 'c-2-2' },
        { combatantId: 'gob', cellId: 'c-3-3' },
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
    const next = applyNoiseAwarenessForSubject(asEncounterState(state), 'orc', { kind: 'movement' })
    expect(getGuessedCellForObserver(next, 'orc', 'wiz')).toBe('c-2-2')
    expect(getGuessedCellForObserver(next, 'orc', 'ally')).toBe('c-2-2')
    expect(getGuessedCellForObserver(next, 'orc', 'gob')).toBeUndefined()
  })

  it('reconcileAwarenessGuessesWithPerception clears a guess when the observer can now perceive the subject', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const wiz = testPc('wiz', 'Wizard', 20)
    const orc = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([wiz, orc], { rng: () => 0.5, space })
    let state: EncounterState = asEncounterState({
      ...base,
      partyCombatantIds: ['wiz'],
      enemyCombatantIds: ['orc'],
      initiativeOrder: ['wiz', 'orc'],
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
    })
    state = setGuessedCellForObserver(state, 'orc', 'wiz', 'c-1-0')
    expect(getGuessedCellForObserver(state, 'orc', 'wiz')).toBe('c-1-0')
    const pruned = reconcileAwarenessGuessesWithPerception(state)
    expect(getGuessedCellForObserver(pruned, 'orc', 'wiz')).toBeUndefined()
    expect(pruned.combatantsById.orc?.awareness).toBeUndefined()
  })

  it('coexists with stealth hidden state: hidden-from and guessed cell can both be set on the subject', () => {
    const state = encounterAttackerOutsideDefenderHeavilyObscured()
    const withStealth = {
      ...state,
      combatantsById: {
        ...state.combatantsById,
        orc: {
          ...state.combatantsById.orc!,
          stealth: { hiddenFromObserverIds: ['wiz'] },
        },
      },
    }
    const next = applyNoiseAwarenessForSubject(withStealth, 'orc', { kind: 'attack' })
    expect(next.combatantsById.orc?.stealth?.hiddenFromObserverIds).toEqual(['wiz'])
    expect(getGuessedCellForObserver(next, 'orc', 'wiz')).toBe('c-2-2')
  })

  it('no placements: noise awareness is a no-op (honest narrow pass)', () => {
    const wiz = testPc('wiz', 'Wizard', 20)
    const orc = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([wiz, orc], { rng: () => 0.5 })
    const state = {
      ...base,
      partyCombatantIds: ['wiz'],
      enemyCombatantIds: ['orc'],
      initiativeOrder: ['wiz', 'orc'],
    }
    const next = applyNoiseAwarenessForSubject(state, 'orc', { kind: 'attack' })
    expect(next).toBe(state)
  })
})
