import type { LocationCellFillKindId } from '@/features/content/locations/domain/model/map/locationCellFill.types';
import type { LocationMapRegionAuthoringEntry } from '@/shared/domain/locations';

import type { LocationMapActivePaintSelection, LocationMapPaintState } from '../types/locationMapEditor.types';

export function createInitialPaintState(): LocationMapPaintState {
  return {
    domain: 'surface',
    surfaceFillKind: null,
    activeRegionId: null,
  };
}

/**
 * Terrain stroke applies only in Surface paint domain with a chosen fill swatch.
 */
export function getActiveSurfaceFillKind(
  selection: LocationMapActivePaintSelection,
): LocationCellFillKindId | null {
  if (!selection || selection.domain !== 'surface') {
    return null;
  }
  return selection.surfaceFillKind;
}

export function canApplySurfaceTerrainPaint(
  selection: LocationMapActivePaintSelection,
): boolean {
  return getActiveSurfaceFillKind(selection) != null;
}

export function resolveActiveRegionEntry(
  entries: readonly LocationMapRegionAuthoringEntry[],
  activeRegionId: string | null | undefined,
): LocationMapRegionAuthoringEntry | null {
  const id = activeRegionId?.trim();
  if (!id) {
    return null;
  }
  return entries.find((e) => e.id === id) ?? null;
}

export function canApplyRegionPaint(
  selection: LocationMapActivePaintSelection,
  regionEntries: readonly LocationMapRegionAuthoringEntry[],
): boolean {
  if (!selection || selection.domain !== 'region') {
    return false;
  }
  return resolveActiveRegionEntry(regionEntries, selection.activeRegionId) != null;
}

/** Surface stroke or region stroke (paint tool). */
export function canApplyAnyPaintStroke(
  selection: LocationMapActivePaintSelection,
  regionEntries: readonly LocationMapRegionAuthoringEntry[],
): boolean {
  return canApplySurfaceTerrainPaint(selection) || canApplyRegionPaint(selection, regionEntries);
}

export function upsertRegionEntry(
  entries: readonly LocationMapRegionAuthoringEntry[],
  entry: LocationMapRegionAuthoringEntry,
): LocationMapRegionAuthoringEntry[] {
  const i = entries.findIndex((e) => e.id === entry.id);
  if (i < 0) {
    return [...entries, entry].sort((a, b) => a.id.localeCompare(b.id));
  }
  const next = [...entries];
  next[i] = entry;
  return next;
}
