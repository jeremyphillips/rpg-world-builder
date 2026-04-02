import type { CombatLogEvent } from '@/features/mechanics/domain/combat'

import type { ActionResolvedViewerRelationship, NormalizedToastViewerContext } from './encounter-toast-types'

function resolvePrimaryActorId(events: CombatLogEvent[]): string | null {
  const strike = events.find((e) => e.type === 'attack-hit' || e.type === 'attack-missed')
  if (strike?.actorId) return strike.actorId
  const declared = events.find((e) => e.type === 'action-declared')
  return declared?.actorId ?? null
}

function collectTargetIds(events: CombatLogEvent[]): Set<string> {
  const s = new Set<string>()
  for (const e of events) {
    if (e.type === 'attack-hit' || e.type === 'attack-missed' || e.type === 'damage-applied') {
      for (const id of e.targetIds ?? []) s.add(id)
    }
  }
  return s
}

function intersectsControlled(targetIds: Set<string>, controlled: string[]): boolean {
  for (const id of controlled) {
    if (targetIds.has(id)) return true
  }
  return false
}

export function deriveActionResolvedViewerRelationship(
  events: CombatLogEvent[],
  normalized: NormalizedToastViewerContext,
): ActionResolvedViewerRelationship {
  if (normalized.mode === 'simulator') {
    return 'actor_controller'
  }

  const actorId = resolvePrimaryActorId(events)
  const targetIds = collectTargetIds(events)

  if (actorId && normalized.controlledCombatantIds.includes(actorId)) {
    return 'actor_controller'
  }
  if (intersectsControlled(targetIds, normalized.controlledCombatantIds)) {
    return 'target_controller'
  }
  if (normalized.tonePerspective === 'dm') {
    return 'dm_observer'
  }
  return 'uninvolved_observer'
}
