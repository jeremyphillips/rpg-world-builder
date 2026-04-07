import type { EncounterAuthoringPresentation } from '@/features/mechanics/domain/combat/space'
import type { LocationMapBase } from '@/shared/domain/locations/map/locationMap.types'
import { deriveLocationMapAuthoredObjectRenderItems } from '@/shared/domain/locations/map/locationMapAuthoredObjectRender.helpers'

import { authorCellIdToCombatCellId } from './encounterMapCellIds'

/**
 * Maps persisted location map authoring into a combat-serializable presentation payload.
 * Consumed by the combat grid for underlays and SVG chrome only.
 *
 * **Coarse edge policy:** `edgeEntries` here are **`{ edgeId, kind }` only** — no authored registry fields.
 * See `src/features/content/locations/domain/authoring/map/locationMapEdgeAuthoring.policy.md`.
 */
export function buildEncounterAuthoringPresentationFromLocationMap(
  map: LocationMapBase,
): EncounterAuthoringPresentation {
  const cellFillByCombatCellId: Record<string, { familyId: string; variantId: string }> = {}
  const regionColorKeyByCombatCellId: Record<string, string> = {}

  const regionMeta = new Map(map.regionEntries.map((r) => [r.id, r.colorKey]))

  for (const e of map.cellEntries ?? []) {
    const combatId = authorCellIdToCombatCellId(e.cellId)
    if (e.cellFill) {
      cellFillByCombatCellId[combatId] = {
        familyId: e.cellFill.familyId,
        variantId: e.cellFill.variantId,
      }
    }
    if (e.regionId) {
      const ck = regionMeta.get(e.regionId)
      if (ck) regionColorKeyByCombatCellId[combatId] = ck
    }
  }

  const authoredObjectRenderItems = deriveLocationMapAuthoredObjectRenderItems(map)

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
    ...(authoredObjectRenderItems.length > 0 ? { authoredObjectRenderItems } : {}),
  }
}
