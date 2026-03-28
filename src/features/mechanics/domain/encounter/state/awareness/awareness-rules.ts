/**
 * Observer-relative **guessed location** when an observer cannot **visually** perceive a subject’s
 * occupant ({@link canSeeForTargeting}). This is **not** a second visibility engine and does
 * **not** satisfy requires-sight targeting.
 *
 * **Boundary:** `CombatantStealthRuntime` / `hiddenFromObserverIds` remain hide bookkeeping only; awareness
 * can coexist (e.g. hidden from an observer who still heard a noise at a cell).
 */

import { getCellForCombatant } from '@/features/encounter/space'

import { updateEncounterCombatant } from '../mutations/mutations'
import { canSeeForTargeting } from '../visibility/visibility-seams'
import type { CombatantAwarenessRuntime } from '../types/combatant.types'
import type { EncounterState } from '../types'

export type NoiseAwarenessKind = 'attack' | 'movement' | 'other'

/**
 * How an observer can **place** a subject for rules that need a tactical location without conflating
 * with **sight** (`canSeeForTargeting`). Used by combat targeting — see `action-targeting.ts`.
 */
export type TargetLocationAwarenessResolution =
  | { kind: 'visible' }
  | { kind: 'guessed-location'; cellId: string }
  | { kind: 'unknown' }

export function getGuessedCellForObserver(
  state: EncounterState,
  subjectId: string,
  observerId: string,
): string | undefined {
  return state.combatantsById[subjectId]?.awareness?.guessedCellByObserverId?.[observerId]
}

/**
 * **Visibility wins:** if the observer can perceive the subject’s occupant, the mode is **visible** —
 * guessed cell is ignored for classification (reconcile still clears redundant guesses elsewhere).
 */
export function resolveTargetLocationAwareness(
  state: EncounterState,
  observerId: string,
  subjectId: string,
): TargetLocationAwarenessResolution {
  if (canSeeForTargeting(state, observerId, subjectId)) {
    return { kind: 'visible' }
  }
  const cellId = getGuessedCellForObserver(state, subjectId, observerId)
  if (cellId) return { kind: 'guessed-location', cellId }
  return { kind: 'unknown' }
}

export function setGuessedCellForObserver(
  state: EncounterState,
  subjectId: string,
  observerId: string,
  cellId: string,
): EncounterState {
  return updateEncounterCombatant(state, subjectId, (c) => ({
    ...c,
    awareness: mergeAwareness(c.awareness, { [observerId]: cellId }),
  }))
}

function mergeAwareness(
  prev: CombatantAwarenessRuntime | undefined,
  patch: Record<string, string>,
): CombatantAwarenessRuntime {
  return {
    guessedCellByObserverId: {
      ...(prev?.guessedCellByObserverId ?? {}),
      ...patch,
    },
  }
}

export function clearGuessedCellForObserver(
  state: EncounterState,
  subjectId: string,
  observerId: string,
): EncounterState {
  const subject = state.combatantsById[subjectId]
  const guesses = subject?.awareness?.guessedCellByObserverId
  if (!guesses || !(observerId in guesses)) return state
  const next = { ...guesses }
  delete next[observerId]
  if (Object.keys(next).length === 0) {
    return stripAwarenessIfEmpty(state, subjectId)
  }
  return updateEncounterCombatant(state, subjectId, (c) => ({
    ...c,
    awareness: { guessedCellByObserverId: next },
  }))
}

function stripAwarenessIfEmpty(state: EncounterState, subjectId: string): EncounterState {
  return updateEncounterCombatant(state, subjectId, (c) => {
    const { awareness, ...rest } = c
    return rest
  })
}

/**
 * **Noise / revealing events:** opposing observers who **cannot** currently perceive the subject’s
 * occupant still learn (or refresh) an estimated **grid cell** for that subject — e.g. hearing an
 * attack or loud movement from that cell. Does **not** grant sight.
 *
 * **Silent movement** does not call this helper in the current pass (no automatic stale clearing —
 * see docs). **TODO:** optional hooks from `moveCombatant` when a “noisy” move flag exists.
 */
export function applyNoiseAwarenessForSubject(
  state: EncounterState,
  subjectId: string,
  _options: { kind: NoiseAwarenessKind },
): EncounterState {
  if (!state.placements) return state
  const cellId = getCellForCombatant(state.placements, subjectId)
  if (!cellId) return state
  const subject = state.combatantsById[subjectId]
  if (!subject) return state

  const observerIds = subject.side === 'party' ? state.enemyCombatantIds : state.partyCombatantIds
  let next = state
  for (const observerId of observerIds) {
    if (observerId === subjectId) continue
    if (canSeeForTargeting(next, observerId, subjectId)) continue
    next = setGuessedCellForObserver(next, subjectId, observerId, cellId)
  }
  return next
}

/**
 * When an observer **can** perceive the subject’s occupant, drop that observer’s guess — vision
 * supersedes sound-only awareness.
 */
export function reconcileAwarenessGuessesWithPerception(state: EncounterState): EncounterState {
  let next = state
  for (const subjectId of Object.keys(next.combatantsById)) {
    const c = next.combatantsById[subjectId]
    const guesses = c?.awareness?.guessedCellByObserverId
    if (!guesses || Object.keys(guesses).length === 0) continue

    const nextGuesses = { ...guesses }
    let changed = false
    for (const observerId of Object.keys(nextGuesses)) {
      if (canSeeForTargeting(next, observerId, subjectId)) {
        delete nextGuesses[observerId]
        changed = true
      }
    }
    if (!changed) continue

    if (Object.keys(nextGuesses).length === 0) {
      next = updateEncounterCombatant(next, subjectId, (c2) => {
        const { awareness, ...rest } = c2
        return rest
      })
    } else {
      next = updateEncounterCombatant(next, subjectId, (c2) => ({
        ...c2,
        awareness: { guessedCellByObserverId: nextGuesses },
      }))
    }
  }
  return next
}
