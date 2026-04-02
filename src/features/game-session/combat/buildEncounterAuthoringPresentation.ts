import type { EncounterAuthoringPresentation } from '@/features/mechanics/domain/combat/space'
import type { LocationMapBase } from '@/shared/domain/locations/map/locationMap.types'

import { authorCellIdToCombatCellId } from './buildEncounterSpaceFromLocationMap'

/**
 * Maps persisted location map authoring into a combat-serializable presentation payload.
 * Consumed by the combat grid for underlays and SVG chrome only.
 */
export function buildEncounterAuthoringPresentationFromLocationMap(
  map: LocationMapBase,
): EncounterAuthoringPresentation {
  const cellFillByCombatCellId: Record<string, string> = {}
  const regionColorKeyByCombatCellId: Record<string, string> = {}

  const regionMeta = new Map(map.regionEntries.map((r) => [r.id, r.colorKey]))

  for (const e of map.cellEntries ?? []) {
    const combatId = authorCellIdToCombatCellId(e.cellId)
    if (e.cellFillKind) {
      cellFillByCombatCellId[combatId] = e.cellFillKind
    }
    if (e.regionId) {
      const ck = regionMeta.get(e.regionId)
      if (ck) regionColorKeyByCombatCellId[combatId] = ck
    }
  }

  return {
    edgeEntries: (map.edgeEntries ?? []).map((e) => ({ edgeId: e.edgeId, kind: e.kind })),
    pathEntries: (map.pathEntries ?? []).map((p) => ({
      id: p.id,
      kind: p.kind,
      cellIds: [...p.cellIds],
    })),
    cellFillByCombatCellId,
    ...(Object.keys(regionColorKeyByCombatCellId).length > 0
      ? { regionColorKeyByCombatCellId }
      : {}),
  }
}
