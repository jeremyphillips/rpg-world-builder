/**
 * Shared icon / label resolution for map placed objects (authored registry + persisted map object kinds).
 * Used by tactical grid cells and authored-map icon overlay so the same kind resolves to the same visual.
 */
import type { LocationMapObjectKindId } from '@/shared/domain/locations';
import type { LocationMapAuthoredObjectRenderItem } from '@/shared/domain/locations/map/locationMapAuthoredObjectRender.types';

import type { LocationMapGlyphIconName } from './locationMapIconNameMap';
import type { LocationPlacedObjectKindId } from '../../model/placedObjects/locationPlacedObject.registry';
import {
  getMapObjectKindIconName,
  getPlacedObjectIconName,
  getPlacedObjectMeta,
  parseLocationPlacedObjectKindId,
} from '../../model/placedObjects/locationPlacedObject.selectors';

export type PlacedObjectCellVisual = {
  /** Human-readable name (registry or map default). */
  label: string
  /** Tooltip text — same as label unless we add descriptions later. */
  tooltip: string
  /** Resolved semantic icon token; null only when no icon path exists. */
  iconName: LocationMapGlyphIconName | null
  /** When true, render the MUI icon for `iconName`. When false, render large centered fallback letter only. */
  showIcon: boolean
  /** First character of `label` (uppercase) for fallback presentation. */
  fallbackLetter: string
}

function fallbackLetterFromLabel(label: string): string {
  const t = label.trim()
  return t.length > 0 ? t.charAt(0).toUpperCase() : '?'
}

function mapObjectKindDefaultLabel(kind: LocationMapObjectKindId): string {
  return kind.length === 0 ? 'Object' : kind.charAt(0).toUpperCase() + kind.slice(1)
}

/** Runtime / tactical grid: `GridObject.authoredPlaceKindId` is always a registry id. */
export function resolvePlacedObjectCellVisualFromPlacedKind(
  placedKindId: LocationPlacedObjectKindId,
): PlacedObjectCellVisual {
  const meta = getPlacedObjectMeta(placedKindId)
  const iconName = getPlacedObjectIconName(placedKindId)
  const label = meta.label
  return {
    label,
    tooltip: label,
    iconName,
    showIcon: true,
    fallbackLetter: fallbackLetterFromLabel(label),
  }
}

/**
 * Authoring / presentation: prefers `authoredPlaceKindId` when it parses to a registry kind;
 * otherwise uses persisted `LocationMapObjectKindId` → `LOCATION_MAP_OBJECT_KIND_TO_ICON_NAME`.
 */
export function resolvePlacedObjectCellVisualFromRenderItem(
  item: LocationMapAuthoredObjectRenderItem,
): PlacedObjectCellVisual {
  const parsed = parseLocationPlacedObjectKindId(item.authoredPlaceKindId)
  if (parsed) {
    const meta = getPlacedObjectMeta(parsed)
    const label = item.label?.trim() ? item.label.trim() : meta.label
    const iconName = getPlacedObjectIconName(parsed)
    return {
      label,
      tooltip: label,
      iconName,
      showIcon: true,
      fallbackLetter: fallbackLetterFromLabel(label),
    }
  }

  const iconName = getMapObjectKindIconName(item.kind)
  const label = item.label?.trim() ? item.label.trim() : mapObjectKindDefaultLabel(item.kind)
  return {
    label,
    tooltip: label,
    iconName,
    showIcon: true,
    fallbackLetter: fallbackLetterFromLabel(label),
  }
}
