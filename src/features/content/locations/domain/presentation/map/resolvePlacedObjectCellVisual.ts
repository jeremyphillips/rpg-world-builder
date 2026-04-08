/**
 * Shared raster / label resolution for map placed objects (authored registry + persisted map object kinds).
 * Used by tactical grid cells and authored-map overlay so the same kind resolves to the same visual.
 */
import type { LocationMapObjectKindId } from '@/shared/domain/locations';
import type { LocationMapAuthoredObjectRenderItem } from '@/shared/domain/locations/map/locationMapAuthoredObjectRender.types';
import { resolvePlacedObjectFootprintLayoutPx } from '@/shared/domain/locations/map/placedObjectFootprintLayout';
import { resolvePlacedObjectCellAnchorOffsetPx } from '@/shared/domain/locations/map/placedObjectPlacementAnchorLayout';

import type { LocationPlacedObjectKindId } from '../../model/placedObjects/locationPlacedObject.registry';
import { getPlacedObjectMapImageUrlForAssetId } from '../../model/placedObjects/locationPlacedObjectRasterAssets';
import {
  getPlacedObjectCellAnchorForFamilyVariant,
  getPlacedObjectFootprintForFamilyVariant,
  getPlacedObjectMeta,
  parseLocationPlacedObjectKindId,
  resolvePersistedMapObjectKindMapImageUrl,
  resolvePlacedObjectKindForCellObject,
  resolvePlacedObjectVariant,
} from '../../model/placedObjects/locationPlacedObject.selectors';

export type PlacedObjectCellVisual = {
  /** Human-readable name (registry or map default). */
  label: string;
  /** Tooltip text — same as label unless we add descriptions later. */
  tooltip: string;
  /** Bundled map raster URL; null when manifest has no map slice (e.g. edge preview-only) or missing asset. */
  mapImageUrl: string | null;
  /** When true, render `mapImageUrl` as an image; otherwise show fallback letter. */
  showMapRaster: boolean;
  /** First character of `label` (uppercase) for fallback presentation. */
  fallbackLetter: string;
  /**
   * When set with `layoutHeightPx`, raster uses this box (Phase 3 footprint layout).
   * Omitted for legacy fixed token sizing or when footprint / cell span is unavailable.
   */
  layoutWidthPx?: number;
  layoutHeightPx?: number;
  /** Phase 5 — translation from cell center after footprint sizing (square grid, placement anchor). */
  layoutAnchorOffsetXPx?: number;
  layoutAnchorOffsetYPx?: number;
};

/** Square-grid context for registry footprint → pixel layout (Phase 3) + anchor (Phase 5). */
export type PlacedObjectCellVisualFootprintLayoutContext = {
  feetPerCell: number;
  cellPx: number;
  /** Authoring grid gutter; use **0** on tactical combat grid. */
  gapPx?: number;
  /** When false, skip Phase 5 anchor offset (e.g. hex). Default true. */
  applyPlacementAnchor?: boolean;
};

function fallbackLetterFromLabel(label: string): string {
  const t = label.trim();
  return t.length > 0 ? t.charAt(0).toUpperCase() : '?';
}

function mapObjectKindDefaultLabel(kind: LocationMapObjectKindId): string {
  return kind.length === 0 ? 'Object' : kind.charAt(0).toUpperCase() + kind.slice(1);
}

/** Runtime / tactical grid: `GridObject.authoredPlaceKindId` is always a registry id. */
export function resolvePlacedObjectCellVisualFromPlacedKind(
  placedKindId: LocationPlacedObjectKindId,
): PlacedObjectCellVisual {
  const meta = getPlacedObjectMeta(placedKindId);
  const { variant } = resolvePlacedObjectVariant(placedKindId, undefined);
  const mapImageUrl = getPlacedObjectMapImageUrlForAssetId(variant.assetId);
  const label = meta.label;
  return {
    label,
    tooltip: label,
    mapImageUrl,
    showMapRaster: mapImageUrl != null,
    fallbackLetter: fallbackLetterFromLabel(label),
  };
}

/**
 * Authoring / presentation: prefers `authoredPlaceKindId` when it parses to a registry kind;
 * otherwise uses persisted `LocationMapObjectKindId` → raster from registry defaults for that kind.
 */
function applyFootprintLayout(
  visual: PlacedObjectCellVisual,
  kind: LocationPlacedObjectKindId,
  variantId: string,
  layout: PlacedObjectCellVisualFootprintLayoutContext,
): PlacedObjectCellVisual {
  const fp = getPlacedObjectFootprintForFamilyVariant(kind, variantId);
  if (!fp) return visual;
  const { widthPx, heightPx } = resolvePlacedObjectFootprintLayoutPx({
    footprint: fp,
    feetPerCell: layout.feetPerCell,
    cellPx: layout.cellPx,
    maxExtentPx: layout.cellPx,
  });
  if (widthPx <= 0 || heightPx <= 0) return visual;
  let out: PlacedObjectCellVisual = { ...visual, layoutWidthPx: widthPx, layoutHeightPx: heightPx };
  if (layout.applyPlacementAnchor === false) {
    return out;
  }
  const anchor = getPlacedObjectCellAnchorForFamilyVariant(kind, variantId);
  const gapPx = layout.gapPx ?? 0;
  const { offsetXPx, offsetYPx } = resolvePlacedObjectCellAnchorOffsetPx(anchor, layout.cellPx, gapPx);
  if (offsetXPx === 0 && offsetYPx === 0) {
    return out;
  }
  return { ...out, layoutAnchorOffsetXPx: offsetXPx, layoutAnchorOffsetYPx: offsetYPx };
}

export function resolvePlacedObjectCellVisualFromRenderItem(
  item: LocationMapAuthoredObjectRenderItem,
  footprintLayout?: PlacedObjectCellVisualFootprintLayoutContext | null,
): PlacedObjectCellVisual {
  const parsed = parseLocationPlacedObjectKindId(item.authoredPlaceKindId);
  if (parsed) {
    const meta = getPlacedObjectMeta(parsed);
    const label = item.label?.trim() ? item.label.trim() : meta.label;
    const { resolvedVariantId, variant } = resolvePlacedObjectVariant(parsed, item.variantId);
    const mapImageUrl = getPlacedObjectMapImageUrlForAssetId(variant.assetId);
    let out: PlacedObjectCellVisual = {
      label,
      tooltip: label,
      mapImageUrl,
      showMapRaster: mapImageUrl != null,
      fallbackLetter: fallbackLetterFromLabel(label),
    };
    if (footprintLayout) {
      out = applyFootprintLayout(out, parsed, resolvedVariantId, footprintLayout);
    }
    return out;
  }

  const mapImageUrl = resolvePersistedMapObjectKindMapImageUrl(item.kind);
  const label = item.label?.trim() ? item.label.trim() : mapObjectKindDefaultLabel(item.kind);
  let out: PlacedObjectCellVisual = {
    label,
    tooltip: label,
    mapImageUrl,
    showMapRaster: mapImageUrl != null,
    fallbackLetter: fallbackLetterFromLabel(label),
  };
  const coerced = resolvePlacedObjectKindForCellObject({
    kind: item.kind,
    authoredPlaceKindId: item.authoredPlaceKindId,
  });
  if (coerced && footprintLayout) {
    const { resolvedVariantId } = resolvePlacedObjectVariant(coerced, item.variantId);
    out = applyFootprintLayout(out, coerced, resolvedVariantId, footprintLayout);
  }
  return out;
}
