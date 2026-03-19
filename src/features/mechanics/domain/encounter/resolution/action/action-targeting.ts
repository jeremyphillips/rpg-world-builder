import type { CombatActionDefinition, CombatActionSequenceStep } from '../combat-action.types'
import type { CombatantInstance } from '../../state'
import type { EncounterState } from '../../state/types'
import type { ResolveCombatActionSelection } from '../action-resolution.types'

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
  return !!combatant.creatureType && filter.includes(combatant.creatureType)
}

export function isHostileAction(action: CombatActionDefinition): boolean {
  const kind = action.targeting?.kind
  return !kind || kind === 'single-target' || kind === 'all-enemies' || kind === 'entered-during-move'
}

export function getCharmedSourceIds(combatant: CombatantInstance): string[] {
  return combatant.conditions
    .filter((m) => m.label === 'charmed' && m.sourceInstanceId)
    .map((m) => m.sourceInstanceId!)
}

export function isValidActionTarget(
  combatant: CombatantInstance,
  actor: CombatantInstance,
  action: CombatActionDefinition,
): boolean {
  const kind = action.targeting?.kind

  if (combatant.states.some((s) => s.label === 'banished')) return false
  if (!passesCreatureTypeFilter(combatant, action.targeting?.creatureTypeFilter)) return false

  if (isHostileAction(action) && getCharmedSourceIds(actor).includes(combatant.instanceId)) {
    return false
  }

  if (kind === 'dead-creature') return combatant.stats.currentHitPoints === 0
  if (combatant.stats.currentHitPoints <= 0) return false
  if (kind === 'single-creature') return true

  return combatant.side !== actor.side
}

export function getActionTargetCandidates(
  state: EncounterState,
  actor: CombatantInstance,
  action: CombatActionDefinition,
): CombatantInstance[] {
  return state.initiativeOrder
    .map((id) => state.combatantsById[id])
    .filter(
      (c): c is CombatantInstance => Boolean(c) && isValidActionTarget(c, actor, action),
    )
}

export function getActionTargets(
  state: EncounterState,
  actor: CombatantInstance,
  selection: ResolveCombatActionSelection,
  action: CombatActionDefinition,
): CombatantInstance[] {
  if (action.targeting?.kind === 'self') return [actor]

  if (action.targeting?.kind === 'all-enemies') {
    return getActionTargetCandidates(state, actor, action)
  }

  if (action.targeting?.kind === 'single-creature') {
    if (!selection.targetId) return [actor]
    const target = state.combatantsById[selection.targetId]
    if (!target || !isValidActionTarget(target, actor, action)) return []
    return [target]
  }

  if (action.targeting?.kind === 'dead-creature') {
    if (!selection.targetId) return []
    const target = state.combatantsById[selection.targetId]
    if (!target || !isValidActionTarget(target, actor, action)) return []
    return [target]
  }

  if (!selection.targetId) return []
  const target = state.combatantsById[selection.targetId]
  if (!target || !isValidActionTarget(target, actor, action)) return []
  return [target]
}
