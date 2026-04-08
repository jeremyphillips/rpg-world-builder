import type { LocationMapBase, LocationMapCellObjectEntry } from './locationMap.types';
import { authorCellIdToCombatCellId } from './locationMapCombatCellIds';
import type { LocationMapAuthoredObjectRenderItem } from './locationMapAuthoredObjectRender.types';

/** One cell object → same render item shape as {@link deriveLocationMapAuthoredObjectRenderItems} (for editor overlay + combat). */
export function mapCellObjectEntryToAuthoredRenderItem(
  authorCellId: string,
  o: LocationMapCellObjectEntry,
): LocationMapAuthoredObjectRenderItem {
  return {
    id: o.id,
    authorCellId,
    combatCellId: authorCellIdToCombatCellId(authorCellId),
    kind: o.kind,
    ...(o.label !== undefined && String(o.label).trim() !== '' ? { label: String(o.label).trim() } : {}),
    ...(o.authoredPlaceKindId !== undefined && String(o.authoredPlaceKindId).trim() !== ''
      ? { authoredPlaceKindId: String(o.authoredPlaceKindId).trim() }
      : {}),
    ...(o.variantId !== undefined && String(o.variantId).trim() !== ''
      ? { variantId: String(o.variantId).trim() }
      : {}),
  };
}

/**
 * All authored objects on a map as a flat list (stable sort by combat cell id then object id).
 */
export function deriveLocationMapAuthoredObjectRenderItems(
  map: LocationMapBase,
): LocationMapAuthoredObjectRenderItem[] {
  const out: LocationMapAuthoredObjectRenderItem[] = [];
  for (const row of map.cellEntries ?? []) {
    const authorCellId = row.cellId;
    for (const o of row.objects ?? []) {
      out.push(mapCellObjectEntryToAuthoredRenderItem(authorCellId, o));
    }
  }
  return out.sort((a, b) => {
    const c = a.combatCellId.localeCompare(b.combatCellId);
    return c !== 0 ? c : a.id.localeCompare(b.id);
  });
}

/** Same derivation as `deriveLocationMapAuthoredObjectRenderItems` for editor draft keyed by author cell id. */
export function deriveLocationMapAuthoredObjectRenderItemsFromObjectsByCellId(
  objectsByCellId: Record<string, LocationMapCellObjectEntry[] | undefined>,
): LocationMapAuthoredObjectRenderItem[] {
  const out: LocationMapAuthoredObjectRenderItem[] = [];
  const keys = Object.keys(objectsByCellId).sort((x, y) => {
    const [ax, ay] = x.split(',').map(Number);
    const [bx, by] = y.split(',').map(Number);
    if (ax !== bx) return ax - bx;
    return ay - by;
  });
  for (const authorCellId of keys) {
    for (const o of objectsByCellId[authorCellId] ?? []) {
      out.push(mapCellObjectEntryToAuthoredRenderItem(authorCellId, o));
    }
  }
  return out.sort((a, b) => {
    const c = a.combatCellId.localeCompare(b.combatCellId);
    return c !== 0 ? c : a.id.localeCompare(b.id);
  });
}
