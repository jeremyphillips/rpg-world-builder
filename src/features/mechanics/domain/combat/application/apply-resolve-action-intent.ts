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

  if (!state.combatantsById[selection.actorId]) {
    return {
      ok: false,
      error: {
        code: 'validation-failed',
        issues: [{ code: 'unknown-actor', message: `No combatant "${selection.actorId}".` }],
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
    events.push({ kind: 'log-appended', entries: appended })
  }

  return { ok: true, nextState: next, events }
}
