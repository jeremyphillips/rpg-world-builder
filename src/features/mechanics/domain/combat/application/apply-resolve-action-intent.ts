import type { CombatIntent } from '../intents'
import type { CombatEvent, CombatIntentResult } from '../results'
import { resolveCombatAction } from '../resolution/action/action-resolver'
import type { EncounterState } from '../state/types'
import type { ApplyCombatIntentContext } from './apply-combat-intent-context.types'

export function applyResolveActionIntent(
  state: EncounterState,
  intent: Extract<CombatIntent, { kind: 'resolve-action' }>,
  ctx: ApplyCombatIntentContext,
): CombatIntentResult {
  const { kind: _discriminant, ...selection } = intent

  const actor = state.combatantsById[selection.actorId]
  if (!actor) {
    return {
      ok: false,
      error: {
        code: 'validation-failed',
        issues: [{ code: 'unknown-actor', message: `No combatant "${selection.actorId}".` }],
      },
    }
  }

  const actions = actor.actions
  if (actions && actions.length > 0 && !actions.some((a) => a.id === selection.actionId)) {
    return {
      ok: false,
      error: {
        code: 'validation-failed',
        issues: [
          {
            code: 'unknown-action',
            message: `Combatant "${selection.actorId}" has no action "${selection.actionId}".`,
          },
        ],
      },
    }
  }

  const startLen = state.log.length
  const next = resolveCombatAction(state, selection, ctx.resolveCombatActionOptions ?? {})
  const appended = next.log.slice(startLen)

  const events: CombatEvent[] = [
    { kind: 'action-resolved', actorId: selection.actorId, actionId: selection.actionId },
  ]
  if (appended.length > 0) {
    events.push({ kind: 'action-log-slice', entryTypes: appended.map((e) => e.type) })
    events.push({ kind: 'log-appended', entries: appended })
  }

  return { ok: true, nextState: next, events }
}
