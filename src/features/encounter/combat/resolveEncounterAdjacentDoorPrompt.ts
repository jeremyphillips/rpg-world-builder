import { getEncounterSpaceForCombatant } from '@/features/mechanics/domain/combat/space/encounter-spaces'
import type { EncounterState } from '@/features/mechanics/domain/combat'
import { getCellAt, getCellById, getCellForCombatant } from '@/features/mechanics/domain/combat/space/space.helpers'
import { findEncounterEdgeBetween } from '@/features/mechanics/domain/combat/space/spatial/edgeCrossing'

export type AdjacentClosedDoorPrompt = {
  cellIdA: string
  cellIdB: string
  mapEdgeId?: string
}

/**
 * Finds a closed door edge adjacent to the combatant's cell (king-adjacency).
 * Neighbor order is sorted by cell id for deterministic tie-break when multiple doors exist.
 */
export function resolveAdjacentClosedDoorPrompt(
  encounterState: EncounterState | null | undefined,
  activeCombatantId: string | null | undefined,
): AdjacentClosedDoorPrompt | null {
  if (!encounterState?.placements?.length || !activeCombatantId) return null
  const space = getEncounterSpaceForCombatant(encounterState, activeCombatantId)
  if (!space) return null
  const combatantCellId = getCellForCombatant(
    encounterState.placements,
    activeCombatantId,
    space,
    encounterState,
  )
  if (!combatantCellId) return null
  const cell = getCellById(space, combatantCellId)
  if (!cell) return null

  const neighborCells = []
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue
      const n = getCellAt(space, cell.x + dx, cell.y + dy)
      if (n) neighborCells.push(n)
    }
  }
  neighborCells.sort((a, b) => a.id.localeCompare(b.id))

  for (const n of neighborCells) {
    const edge = findEncounterEdgeBetween(space, combatantCellId, n.id)
    if (!edge || edge.kind !== 'door') continue
    if (edge.blocksMovement !== true) continue
    return {
      cellIdA: combatantCellId,
      cellIdB: n.id,
      mapEdgeId: edge.mapEdgeId,
    }
  }
  return null
}
