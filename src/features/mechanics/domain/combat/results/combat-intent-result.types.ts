import type { CombatLogEvent, CombatLogEventType, EncounterState } from '../state/types'
import type { CombatIntentKind } from '../intents'

export type CombatValidationIssue = {
  code: string
  message: string
}

export type CombatDispatchError =
  | { code: 'no-encounter-state'; message: string }
  | { code: 'actor-mismatch'; message: string }
  | {
      code: 'not-implemented'
      intentKind: CombatIntentKind
      message: string
    }
  | { code: 'validation-failed'; issues: CombatValidationIssue[] }

/**
 * Canonical records derived from intent handling — for logs, toasts, replay, future server broadcast.
 * Phase 4A keeps this narrow; expand in later passes.
 */
export type CombatEvent =
  | {
      kind: 'turn-ended'
      previousActiveCombatantId: string | null
      nextActiveCombatantId: string | null
    }
  | { kind: 'log-appended'; entries: CombatLogEvent[] }
  | { kind: 'combatant-moved'; combatantId: string; fromCellId: string | null; toCellId: string | null }
  | { kind: 'action-resolved'; actorId: string; actionId: string }
  /** Summary of log entry types appended during this resolution (for 4D+ consumers; no ad hoc strings). */
  | { kind: 'action-log-slice'; entryTypes: CombatLogEventType[] }

export type CombatIntentSuccess = {
  ok: true
  nextState: EncounterState
  events: CombatEvent[]
}

export type CombatIntentFailure = {
  ok: false
  error: CombatDispatchError
}

export type CombatIntentResult = CombatIntentSuccess | CombatIntentFailure
