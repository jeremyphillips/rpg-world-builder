import type { CombatActionDefinition, CombatActionSequenceStep } from '../combat-action.types'
import type { CombatantInstance } from '../../state'
import type { EncounterState } from '../../state/types'
import type { ResolveCombatActionSelection } from '../action-resolution.types'
import { cannotTargetWithHostileAction } from '../../state/condition-rules'
import { canSeeForTargeting } from '../../state/visibility-seams'

/** Options for who counts as a valid target; mirrors {@link import('../action-resolution.types').ResolveCombatActionOptions} targeting fields. */
export type ActionTargetingResolveOptions = {
  suppressSameSideHostileActions?: boolean
}

export function getTrackedPartCount(
  state: EncounterState,
  actorId: string,
  part: 'head' | 'limb',
): number {
  return state.combatantsById[actorId]?.trackedParts?.find(
    (trackedPart) => trackedPart.part === part,
  )?.currentCount ?? 0
}

export function getSequenceStepCount(
  state: EncounterState,
  actorId: string,
  step: CombatActionSequenceStep,
): number {
  if (step.countFromTrackedPart) {
    return getTrackedPartCount(state, actorId, step.countFromTrackedPart)
  }

  return step.count
}

function passesCreatureTypeFilter(
  combatant: CombatantInstance,
  filter: string[] | undefined,
): boolean {
  if (!filter || filter.length === 0) return true
  const t = combatant.creatureType?.toLowerCase()
  if (!t) return false
  return filter.some((f) => f.toLowerCase() === t)
}

export function isHostileAction(action: CombatActionDefinition): boolean {
  if (action.hostileApplication !== undefined) {
    return action.hostileApplication
  }
  const kind = action.targeting?.kind
  if (kind === 'none') return false
  if (action.targeting?.requiresWilling) return false
  return !kind || kind === 'single-target' || kind === 'all-enemies' || kind === 'entered-during-move'
}

export function getCharmedSourceIds(combatant: CombatantInstance): string[] {
  return combatant.conditions
    .filter((m) => m.label === 'charmed' && m.sourceInstanceId)
    .map((m) => m.sourceInstanceId!)
}

function shouldSuppressSameSideHostile(options?: ActionTargetingResolveOptions): boolean {
  return options?.suppressSameSideHostileActions !== false
}

export function isValidActionTarget(
  state: EncounterState,
  combatant: CombatantInstance,
  actor: CombatantInstance,
  action: CombatActionDefinition,
  options?: ActionTargetingResolveOptions,
): boolean {
  const kind = action.targeting?.kind
  const suppressSameSideHostile = shouldSuppressSameSideHostile(options)

  if (combatant.states.some((s) => s.label === 'banished')) return false
  if (!passesCreatureTypeFilter(combatant, action.targeting?.creatureTypeFilter)) return false

  if (isHostileAction(action) && cannotTargetWithHostileAction(actor, combatant.instanceId)) {
    return false
  }

  if (
    action.targeting?.requiresSight &&
    kind !== 'self' &&
    kind !== 'all-enemies' &&
    kind !== 'none' &&
    !canSeeForTargeting(state, actor.instanceId, combatant.instanceId)
  ) {
    return false
  }

  if (kind === 'none') return false
  if (kind === 'dead-creature') return combatant.stats.currentHitPoints === 0
  if (combatant.stats.currentHitPoints <= 0) return false
  if (kind === 'single-creature') return true

  if (kind === 'single-target') {
    if (action.targeting?.requiresWilling) {
      return combatant.side === actor.side
    }
    if (suppressSameSideHostile && isHostileAction(action)) {
      return combatant.side !== actor.side
    }
    return true
  }

  return combatant.side !== actor.side
}

export function getActionTargetCandidates(
  state: EncounterState,
  actor: CombatantInstance,
  action: CombatActionDefinition,
  options?: ActionTargetingResolveOptions,
): CombatantInstance[] {
  return state.initiativeOrder
    .map((id) => state.combatantsById[id])
    .filter(
      (c): c is CombatantInstance => Boolean(c) && isValidActionTarget(state, c, actor, action, options),
    )
}

export function getActionTargets(
  state: EncounterState,
  actor: CombatantInstance,
  selection: ResolveCombatActionSelection,
  action: CombatActionDefinition,
  options?: ActionTargetingResolveOptions,
): CombatantInstance[] {
  if (action.targeting?.kind === 'none') return []

  if (action.targeting?.kind === 'self') return [actor]

  if (action.targeting?.kind === 'all-enemies') {
    return getActionTargetCandidates(state, actor, action, options)
  }

  if (action.targeting?.kind === 'single-creature') {
    if (!selection.targetId) return [actor]
    const target = state.combatantsById[selection.targetId]
    if (!target || !isValidActionTarget(state, target, actor, action, options)) return []
    return [target]
  }

  if (action.targeting?.kind === 'dead-creature') {
    if (!selection.targetId) return []
    const target = state.combatantsById[selection.targetId]
    if (!target || !isValidActionTarget(state, target, actor, action, options)) return []
    return [target]
  }

  if (!selection.targetId) return []
  const target = state.combatantsById[selection.targetId]
  if (!target || !isValidActionTarget(state, target, actor, action, options)) return []
  return [target]
}
