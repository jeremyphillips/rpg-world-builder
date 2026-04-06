import type { Location } from '@/features/content/locations/domain/model/location';
import type { AuthoredPlacedObjectVariantPresentation } from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.registry';
import {
  getPlacedObjectDefinition,
  parseLocationPlacedObjectKindId,
  type LocationPlacedObjectKindId,
} from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.types';
import type { LocationMapObjectKindId } from '@/shared/domain/locations';
import { parseGridCellId } from '@/shared/domain/grid/gridCellIds';
import { parseSquareEdgeId } from '@/shared/domain/grid/gridEdgeIds';

function cellPlacementFragment(cellId: string): string {
  const p = parseGridCellId(cellId);
  if (!p) return cellId;
  return `Cell ${p.x},${p.y}`;
}

const SIDE_WORD: Record<'N' | 'E' | 'S' | 'W', string> = {
  N: 'north',
  E: 'east',
  S: 'south',
  W: 'west',
};

/**
 * Human-readable placement for a square grid edge id (`between:…` or `perimeter:…`).
 * Falls back to `Edge {edgeId}` when parsing fails.
 */
export function formatEdgePlacementLine(edgeId: string): string {
  const p = parseSquareEdgeId(edgeId);
  if (!p) return `Edge ${edgeId}`;
  if (p.kind === 'between') {
    return `Between ${cellPlacementFragment(p.cellA)} and ${cellPlacementFragment(p.cellB)}`;
  }
  return `${cellPlacementFragment(p.cellId)} · ${SIDE_WORD[p.side]} edge`;
}

/** Human-readable cell coordinates for the placement slot (Phase 4 shared template). */
export function formatCellPlacementLine(cellId: string): string {
  const p = parseGridCellId(cellId);
  if (!p) return `Cell ${cellId}`;
  return `Cell ${p.x},${p.y}`;
}

const LEGACY_MAP_OBJECT_KIND_TITLE: Record<LocationMapObjectKindId, string> = {
  marker: 'Marker',
  table: 'Table',
  treasure: 'Treasure',
  door: 'Door',
  stairs: 'Stairs',
};

/** Title when `authoredPlaceKindId` is missing (legacy / non-palette rows). */
export function legacyMapObjectKindTitle(kind: LocationMapObjectKindId): string {
  return LEGACY_MAP_OBJECT_KIND_TITLE[kind] ?? kind;
}

/**
 * When true, the rail should show the linked campaign location name as display identity and hide the freeform Label field.
 * Applies to registry families with `linkedScale` that matches the linked location’s scale.
 */
export function shouldShowLinkedIdentityForPlacedObject(
  placedKind: LocationPlacedObjectKindId | null,
  linkedLocationId: string | undefined,
  linkedLoc: Location | undefined,
): boolean {
  if (!placedKind || !linkedLocationId || !linkedLoc) return false;
  const def = getPlacedObjectDefinition(placedKind);
  if (!def.linkedScale) return false;
  return linkedLoc.scale === def.linkedScale;
}

export type PresentationMetadataRow = { label: string; value: string };

function formatPresentationKey(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function formatPresentationValue(raw: string): string {
  return raw.replace(/_/g, ' ').replace(/-/g, ' ');
}

/**
 * First-pass metadata rows from registry `variant.presentation` — no per-object config map.
 */
export function presentationRowsFromPresentation(
  presentation: AuthoredPlacedObjectVariantPresentation | undefined,
): PresentationMetadataRow[] {
  if (!presentation) return [];
  const out: PresentationMetadataRow[] = [];
  for (const [k, v] of Object.entries(presentation)) {
    if (v === undefined || v === null || String(v).trim() === '') continue;
    out.push({
      label: formatPresentationKey(k),
      value: formatPresentationValue(String(v)),
    });
  }
  return out;
}

