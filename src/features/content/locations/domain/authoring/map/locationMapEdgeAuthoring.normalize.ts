import type { LocationMapEdgeAuthoringEntry, LocationMapEdgeKindId } from '@/shared/domain/locations';

import {
  isVariantIdValidForFamily,
  parseLocationPlacedObjectKindId,
  type LocationPlacedObjectKindId,
} from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.types';

/**
 * Registry-aware normalization for persisted edge rows (save pipeline, not speculative UI inference).
 *
 * - **Legacy** `{ edgeId, kind }` — unchanged.
 * - **Conflict** — valid `authoredPlaceKindId` for door/window wins: `kind` is repaired to match.
 * - **Invalid `variantId`** — stripped when not a key on the resolved family.
 * - **Invalid `authoredPlaceKindId` string** — stripped when not a known registry id.
 */
export function normalizeEdgeAuthoringEntryForPersistence(
  entry: LocationMapEdgeAuthoringEntry,
): LocationMapEdgeAuthoringEntry {
  let kind: LocationMapEdgeKindId = entry.kind;
  let authoredPlaceKindId = entry.authoredPlaceKindId;
  let variantId = entry.variantId;

  const trimmedAuthored =
    authoredPlaceKindId != null && String(authoredPlaceKindId).trim() !== ''
      ? String(authoredPlaceKindId).trim()
      : undefined;

  const parsedAuthored = parseLocationPlacedObjectKindId(trimmedAuthored ?? null);

  if (parsedAuthored === 'door' || parsedAuthored === 'window') {
    kind = parsedAuthored;
  }

  if (trimmedAuthored !== undefined) {
    if (parsedAuthored == null) {
      authoredPlaceKindId = undefined;
    } else {
      authoredPlaceKindId = trimmedAuthored;
    }
  } else {
    authoredPlaceKindId = undefined;
  }

  const family: LocationPlacedObjectKindId | null =
    parseLocationPlacedObjectKindId(authoredPlaceKindId) ??
    (kind === 'door' || kind === 'window' ? kind : null);

  if (family != null && variantId != null && variantId !== '') {
    if (!isVariantIdValidForFamily(family, variantId)) {
      variantId = undefined;
    }
  } else if (variantId != null && family == null) {
    variantId = undefined;
  }

  const label =
    entry.label != null && String(entry.label).trim() !== '' ? String(entry.label).trim() : undefined;

  return {
    edgeId: entry.edgeId,
    kind,
    ...(authoredPlaceKindId !== undefined ? { authoredPlaceKindId } : {}),
    ...(variantId != null && variantId !== '' ? { variantId } : {}),
    ...(label ? { label } : {}),
    ...(entry.state !== undefined ? { state: entry.state } : {}),
  };
}

export function normalizeEdgeAuthoringEntriesForPersistence(
  entries: readonly LocationMapEdgeAuthoringEntry[],
): LocationMapEdgeAuthoringEntry[] {
  return entries.map(normalizeEdgeAuthoringEntryForPersistence);
}
