import type {
  CombatActionDefinition,
  CombatActionSequenceStep,
  CombatActionTargetingProfile,
} from '../combat-action.types'
import type { CombatantInstance } from '../../state'
import type { EncounterState } from '../../state/types'
import type { ResolveCombatActionSelection } from '../action-resolution.types'
import { cannotTargetWithHostileAction } from '../../state/condition-rules'
import { canSeeForTargeting } from '../../state/visibility-seams'
import { gridDistanceFt, getCellForCombatant, isWithinRange } from '@/features/encounter/space'
import type { CombatActionAreaTemplate } from '../combat-action.types'

/** Chebyshev distance from origin cell to combatant cell; used as first-pass sphere/cube approximation. */
export function areaTemplateRadiusFt(template: CombatActionAreaTemplate): number {
  if (template.kind === 'sphere') return template.radiusFt
  return template.edgeFt / 2
}

function combatantCellWithinAoeRadius(
  state: EncounterState,
  combatantId: string,
  originCellId: string,
  radiusFt: number,
): boolean {
  if (!state.space || !state.placements) return false
  const cellId = getCellForCombatant(state.placements, combatantId)
  if (!cellId) return false
  const d = gridDistanceFt(state.space, originCellId, cellId)
  return d !== undefined && d <= radiusFt
}

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

/**
 * When a new round starts, `advanceEncounterTurn` re-rolls initiative from living combatants only,
 * so dead bodies drop out of `initiativeOrder` while remaining in `combatantsById`. Dead-creature
 * spells must still see those corpses as candidates.
 */
function getCombatantsToScanForTargeting(
  state: EncounterState,
  targetingKind: CombatActionTargetingProfile['kind'] | undefined,
): CombatantInstance[] {
  if (targetingKind !== 'dead-creature') {
    return state.initiativeOrder
      .map((id) => state.combatantsById[id])
      .filter((c): c is CombatantInstance => Boolean(c))
  }

  const byId = state.combatantsById
  const seen = new Set<string>()
  const ordered: CombatantInstance[] = []
  for (const id of state.initiativeOrder) {
    const c = byId[id]
    if (c) {
      seen.add(id)
      ordered.push(c)
    }
  }
  const rest = Object.values(byId)
    .filter((c) => !seen.has(c.instanceId))
    .sort((a, b) => a.instanceId.localeCompare(b.instanceId))
  return [...ordered, ...rest]
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

  if (
    action.targeting?.rangeFt != null &&
    kind !== 'self' &&
    kind !== 'none' &&
    state.space &&
    state.placements &&
    !isWithinRange(state.space, state.placements, actor.instanceId, combatant.instanceId, action.targeting.rangeFt)
  ) {
    return false
  }

  if (kind === 'none') return false
  if (kind === 'dead-creature') {
    if (combatant.stats.currentHitPoints !== 0) return false
    const r = combatant.remains
    if (r === 'dust' || r === 'disintegrated') return false
    return true
  }
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

/**
 * Mirrors {@link isValidActionTarget} but returns a short user-facing reason
 * string for the first failing check, or `null` when the target is valid.
 */
export function getActionTargetInvalidReason(
  state: EncounterState,
  combatant: CombatantInstance,
  actor: CombatantInstance,
  action: CombatActionDefinition,
  options?: ActionTargetingResolveOptions,
): string | null {
  const kind = action.targeting?.kind
  const suppressSameSideHostile = shouldSuppressSameSideHostile(options)

  if (combatant.states.some((s) => s.label === 'banished')) return 'Target is banished'

  if (kind === 'dead-creature') {
    if (combatant.stats.currentHitPoints !== 0) return 'Requires dead creature'
    const r = combatant.remains
    if (r === 'dust' || r === 'disintegrated') return 'Remains destroyed'
    return null
  }
  
  if (!passesCreatureTypeFilter(combatant, action.targeting?.creatureTypeFilter)) return 'Invalid creature type'

  if (isHostileAction(action) && cannotTargetWithHostileAction(actor, combatant.instanceId)) {
    return 'Cannot target (charmed)'
  }

  if (
    action.targeting?.requiresSight &&
    kind !== 'self' &&
    kind !== 'all-enemies' &&
    kind !== 'none' &&
    !canSeeForTargeting(state, actor.instanceId, combatant.instanceId)
  ) {
    return 'Target not visible'
  }

  if (kind === 'none') return 'No target required'

  if (combatant.stats.currentHitPoints <= 0) return 'Target is defeated'
  if (kind === 'single-creature') return null

  if (kind === 'single-target') {
    if (action.targeting?.requiresWilling) {
      return combatant.side === actor.side ? null : 'Requires willing ally'
    }
    if (suppressSameSideHostile && isHostileAction(action)) {
      return combatant.side !== actor.side ? null : 'Requires enemy target'
    }
    return null
  }

  if (
    action.targeting?.rangeFt != null &&
    kind !== 'self' &&
    kind !== 'none' &&
    state.space &&
    state.placements &&
    !isWithinRange(state.space, state.placements, actor.instanceId, combatant.instanceId, action.targeting.rangeFt)
  ) {
    return 'Out of range'
  }
  
  return combatant.side !== actor.side ? null : 'Requires enemy target'
}

export function getActionTargetCandidates(
  state: EncounterState,
  actor: CombatantInstance,
  action: CombatActionDefinition,
  options?: ActionTargetingResolveOptions,
): CombatantInstance[] {
  return getCombatantsToScanForTargeting(state, action.targeting?.kind).filter((c) =>
    isValidActionTarget(state, c, actor, action, options),
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
    const candidates = getActionTargetCandidates(state, actor, action, options)
    const template = action.areaTemplate
    if (!template) return candidates

    const originCellId = selection.aoeOriginCellId
    if (!originCellId) return []

    const radiusFt = areaTemplateRadiusFt(template)
    return candidates.filter((c) => combatantCellWithinAoeRadius(state, c.instanceId, originCellId, radiusFt))
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
