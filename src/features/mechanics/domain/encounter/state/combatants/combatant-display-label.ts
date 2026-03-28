import type { CombatantInstance } from '../types'

/**
 * Human-facing name for UI and log copy. Uses plain `source.label` when the encounter has at most
 * one combatant for that `(source.kind, source.sourceId)`; otherwise appends `(1)`, `(2)`, … by
 * stable `instanceId` order. Does not mutate stored data.
 */
export function getCombatantDisplayLabel(
  combatant: CombatantInstance,
  allCombatants: readonly CombatantInstance[],
): string {
  const peers = allCombatants.filter(
    (c) => c.source.sourceId === combatant.source.sourceId && c.source.kind === combatant.source.kind,
  )
  const baseName = combatant.source.label
  if (peers.length <= 1) return baseName

  const sorted = [...peers].sort((a, b) => a.instanceId.localeCompare(b.instanceId))
  const index = sorted.findIndex((c) => c.instanceId === combatant.instanceId)
  const n = index >= 0 ? index + 1 : sorted.length
  return `${baseName} (${n})`
}
