import {
  applyCombatIntent,
  startEncounterFromSetup,
  type ApplyCombatIntentContext,
  type CombatIntent,
  type CombatIntentResult,
  type CombatStartupInput,
  type CombatStartupFailure,
  type EncounterState,
} from '@rpg-world-builder/mechanics'

import { getCombatSessionBackend } from '../persistence/combatSession.backend'
import type { CombatSessionRecord } from '../persistence/combatSession.backend'

export async function getPersistedCombatSession(sessionId: string): Promise<CombatSessionRecord | null> {
  const backend = getCombatSessionBackend()
  return backend.getSession(sessionId)
}

export type CreatePersistedSessionResult =
  | { ok: true; sessionId: string; revision: number; state: EncounterState }
  | CombatStartupFailure

export async function createPersistedCombatSession(
  input: CombatStartupInput,
): Promise<CreatePersistedSessionResult> {
  const startup = startEncounterFromSetup(input)
  if (!startup.ok) {
    return startup
  }
  const backend = getCombatSessionBackend()
  const { sessionId, revision } = await backend.createSession(startup.state)
  return { ok: true, sessionId, revision, state: startup.state }
}

export type ApplyPersistedIntentResult =
  | { kind: 'not-found' }
  | { kind: 'stale'; currentRevision: number }
  | {
      kind: 'mechanics-rejected'
      revision: number
      result: CombatIntentResult
    }
  | {
      kind: 'success'
      revision: number
      result: Extract<CombatIntentResult, { ok: true }>
      state: EncounterState
    }

export async function applyPersistedIntent(
  sessionId: string,
  baseRevision: number,
  intent: CombatIntent,
  context: ApplyCombatIntentContext,
): Promise<ApplyPersistedIntentResult> {
  const backend = getCombatSessionBackend()
  const session = await backend.getSession(sessionId)
  if (!session) {
    return { kind: 'not-found' }
  }
  if (session.revision !== baseRevision) {
    return { kind: 'stale', currentRevision: session.revision }
  }

  const result = applyCombatIntent(session.state, intent, context)

  if (!result.ok) {
    return {
      kind: 'mechanics-rejected',
      revision: session.revision,
      result,
    }
  }

  const commit = await backend.tryCommitMutation(sessionId, baseRevision, result.nextState)
  if (!commit.ok) {
    if (commit.reason === 'not-found') {
      return { kind: 'not-found' }
    }
    return { kind: 'stale', currentRevision: commit.currentRevision ?? session.revision }
  }

  return {
    kind: 'success',
    revision: commit.revision,
    result,
    state: result.nextState,
  }
}
