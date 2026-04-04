/**
 * Local combat intent application: validates, routes to shared engine functions, returns structured results.
 *
 * Today this runs in the client as a thin reducer-style seam. Later the same {@link applyCombatIntent}
 * contract can be backed by server authority (HTTP or websocket) without changing the intent/result types.
 * Do not add Encounter routes, setup modals, or React concerns here.
 *
 * See MUTATION_ENTRY_POINTS.md for UI mutation sites, migrated vs unmigrated flows, and Phase 4E seam boundaries.
 */

import type { CombatIntent } from '../intents'
import type { CombatEvent, CombatIntentResult } from '../results'
import { advanceEncounterTurn } from '../state/runtime'
import type { EncounterState } from '../state/types'
import type { ApplyCombatIntentContext } from './apply-combat-intent-context.types'
import { applyMoveCombatantIntent } from './apply-move-combatant-intent'
import { applyResolveActionIntent } from './apply-resolve-action-intent'
import { applyStairTraversalIntent } from './apply-stair-traversal-intent'

export function applyCombatIntent(
  state: EncounterState | null,
  intent: CombatIntent,
  ctx: ApplyCombatIntentContext = {},
): CombatIntentResult {
  if (state == null) {
    return {
      ok: false,
      error: {
        code: 'no-encounter-state',
        message: 'No encounter state loaded; cannot apply combat intent.',
      },
    }
  }

  switch (intent.kind) {
    case 'end-turn':
      return applyEndTurnIntent(state, intent, ctx)
    case 'move-combatant':
      return applyMoveCombatantIntent(state, intent, ctx)
    case 'stair-traversal':
      return applyStairTraversalIntent(state, intent, ctx)
    case 'resolve-action':
      return applyResolveActionIntent(state, intent, ctx)
    case 'place-area':
    case 'choose-spawn-cell':
      return {
        ok: false,
        error: {
          code: 'not-implemented',
          intentKind: intent.kind,
          message: `Intent "${intent.kind}" is not yet handled by applyCombatIntent.`,
        },
      }
  }
}

function applyEndTurnIntent(
  state: EncounterState,
  intent: Extract<CombatIntent, { kind: 'end-turn' }>,
  ctx: ApplyCombatIntentContext,
): CombatIntentResult {
  if (intent.actorId != null && intent.actorId !== state.activeCombatantId) {
    return {
      ok: false,
      error: {
        code: 'actor-mismatch',
        message: `End turn expected active combatant ${state.activeCombatantId ?? 'none'}, got ${intent.actorId}.`,
      },
    }
  }

  const previousActiveCombatantId = state.activeCombatantId
  const startLen = state.log.length
  const next = advanceEncounterTurn(state, ctx.advanceEncounterTurnOptions ?? {})
  const appended = next.log.slice(startLen)

  const events: CombatEvent[] = [
    {
      kind: 'turn-ended',
      previousActiveCombatantId,
      nextActiveCombatantId: next.activeCombatantId,
    },
  ]
  if (appended.length > 0) {
    events.push({ kind: 'log-appended', entries: appended })
  }

  return { ok: true, nextState: next, events }
}
