/**
 * @file Hydration / precedence for edge-authored instances (inspector + previews).
 *
 * ## Follow-up (not this slice)
 * - **Rich `state` editors** — bind discriminated {@link LocationMapEdgeAuthoringState} when gameplay/authoring fields ship.
 * - **Downstream consumers** — encounter build, combat, export: audit any logic that still keys only on coarse `kind`;
 *   prefer this helper or explicit documented fallback.
 * - **Cell `variantId` parity** — add optional `variantId` to {@link LocationMapCellObjectEntry} using the same
 *   registry validation patterns as edge rows.
 */

import type { LocationMapEdgeAuthoringEntry } from '@/shared/domain/locations';

import {
  getPlacedObjectPaletteCategoryId,
  getPlacedObjectPaletteCategoryLabel,
  getPlacedObjectVariantLabel,
  getPlacedObjectVariantPresentation,
  LOCATION_PLACED_OBJECT_KIND_META,
  normalizeVariantIdForFamily,
  parseLocationPlacedObjectKindId,
  type LocationPlacedObjectKindId,
} from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.types';
import type { AuthoredPlacedObjectVariantPresentation } from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.registry';

/**
 * Single hydration / precedence path for edge-authored instances (inspector, metadata, previews).
 * Coarse `kind` is used only when authored identity is absent (legacy rows).
 */
export type ResolvedAuthoredEdgeInstance = {
  /** Persisted coarse kind (always set). */
  edgeKind: LocationMapEdgeAuthoringEntry['kind'];
  /** Registry family when this edge is a door/window authored object. */
  placedKind: LocationPlacedObjectKindId | null;
  /** Resolved variant id (persisted or registry default). */
  variantId: string;
  label: string | undefined;
  /** Presentation rows source — concrete variant when identity resolves to a family. */
  presentation: AuthoredPlacedObjectVariantPresentation | undefined;
  /**
   * True when the row is legacy door/window data with only coarse `kind` (no persisted authored identity).
   */
  legacyIdentityFallback: boolean;
  objectTitle: string;
  categoryLabel: string;
};

export function resolveAuthoredEdgeInstance(entry: LocationMapEdgeAuthoringEntry): ResolvedAuthoredEdgeInstance {
  const parsedAuthored = parseLocationPlacedObjectKindId(entry.authoredPlaceKindId);
  const fromKind: LocationPlacedObjectKindId | null =
    entry.kind === 'door' || entry.kind === 'window' ? entry.kind : null;
  const placedKind: LocationPlacedObjectKindId | null = parsedAuthored ?? fromKind;

  const legacyIdentityFallback =
    (entry.kind === 'door' || entry.kind === 'window') &&
    entry.authoredPlaceKindId == null &&
    entry.variantId == null;

  if (placedKind === 'door' || placedKind === 'window') {
    const variantId = normalizeVariantIdForFamily(placedKind, entry.variantId);
    const presentation = getPlacedObjectVariantPresentation(placedKind, variantId);
    const variantLabel = getPlacedObjectVariantLabel(placedKind, variantId);
    const objectTitle =
      variantLabel ?? LOCATION_PLACED_OBJECT_KIND_META[placedKind].label;
    const categoryLabel = getPlacedObjectPaletteCategoryLabel(
      getPlacedObjectPaletteCategoryId(placedKind),
    );
    return {
      edgeKind: entry.kind,
      placedKind,
      variantId,
      label: entry.label?.trim() || undefined,
      presentation,
      legacyIdentityFallback,
      objectTitle,
      categoryLabel,
    };
  }

  return {
    edgeKind: entry.kind,
    placedKind: null,
    variantId: '',
    label: entry.label?.trim() || undefined,
    presentation: undefined,
    legacyIdentityFallback: false,
    objectTitle: 'Wall',
    categoryLabel: 'Structure',
  };
}
