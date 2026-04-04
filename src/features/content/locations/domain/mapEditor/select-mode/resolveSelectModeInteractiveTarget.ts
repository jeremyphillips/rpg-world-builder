import type { LocationMapEdgeAuthoringEntry } from '@/shared/domain/locations';
import type { EdgeSegmentGeometry, PathPolylineGeometry } from '@/shared/domain/locations/map/locationMapGeometry.types';

import type { LocationMapSelection } from '@/features/content/locations/components/workspace/locationEditorRail.types';
import { getSquareEdgeOrientationFromEdgeId } from '../edge';
import {
  DEFAULT_EDGE_PICK_HALF_WIDTH_PX,
  DEFAULT_PATH_PICK_TOLERANCE_PX,
  resolveNearestEdgeHit,
  resolveNearestPathHit,
} from './locationMapSelectionHitTest';
import { deriveSquareEdgeRunSelection } from '../edge';
import { resolveSelectModeAfterPathEdgeHits } from './resolveSelectModeRegionOrCellSelection';

type Objectish = { id: string };

export type ResolveSelectModeInteractiveTargetParams = {
  /** Event target (or elementFromPoint) for DOM hits on object / linked icons. */
  targetElement: HTMLElement | null;
  /**
   * Viewport coordinates for `document.elementsFromPoint`. When set with {@link clientY}, the
   * resolver walks the hit-test stack so `[data-map-object-id]` wins over SVG paths/edges drawn
   * above the cell grid (same priority as topmost pixel alone would miss the icon).
   */
  clientX?: number;
  clientY?: number;
  /** Pointer position in grid-local pixels. */
  gx: number;
  gy: number;
  /** Cell used for interior resolution when geometry does not pick path/edge. */
  anchorCellId: string;
  objectsByCellId: Record<string, Objectish[] | undefined>;
  linkedLocationByCellId: Record<string, string | undefined>;
  regionIdByCellId: Record<string, string | undefined>;
  pathPolys: readonly PathPolylineGeometry[];
  /** Square grid only; when null or empty, edge picking is skipped. */
  edgeGeoms: readonly EdgeSegmentGeometry[] | null;
  edgeEntries: readonly LocationMapEdgeAuthoringEntry[];
  isHex: boolean;
  /**
   * When true, skip path/edge geometry (e.g. grid container not ready).
   * Still applies DOM object/link and draft interior resolution.
   */
  skipGeometry?: boolean;
};

function edgeHitToSelection(
  edgeHit: { edgeId: string },
  edgeEntries: readonly LocationMapEdgeAuthoringEntry[],
): LocationMapSelection | null {
  const run = deriveSquareEdgeRunSelection(edgeHit.edgeId, edgeEntries);
  const entry = edgeEntries.find((e) => e.edgeId === edgeHit.edgeId);
  const axis = entry ? getSquareEdgeOrientationFromEdgeId(edgeHit.edgeId) : null;
  if (run) {
    return {
      type: 'edge-run',
      kind: run.kind,
      edgeIds: run.edgeIds,
      axis: run.axis,
      anchorEdgeId: run.anchorEdgeId,
    };
  }
  if (entry && axis) {
    return {
      type: 'edge-run',
      kind: entry.kind,
      edgeIds: [edgeHit.edgeId],
      axis,
      anchorEdgeId: edgeHit.edgeId,
    };
  }
  return null;
}

function pickDomMapSelectionFromStack(
  clientX: number,
  clientY: number,
  anchorCellId: string,
): LocationMapSelection | null {
  if (typeof document === 'undefined' || typeof document.elementsFromPoint !== 'function') {
    return null;
  }
  const stack = document.elementsFromPoint(clientX, clientY);
  for (const node of stack) {
    const el = node instanceof HTMLElement ? node : null;
    if (!el) continue;
    const objWrap = el.closest('[data-map-object-id]');
    if (objWrap) {
      const objectId = objWrap.getAttribute('data-map-object-id');
      const cellId = objWrap.getAttribute('data-map-object-cell-id') ?? anchorCellId;
      if (objectId) {
        return { type: 'object', cellId, objectId };
      }
    }
    const linkedWrap = el.closest('[data-map-linked-cell]');
    if (linkedWrap) {
      const cellId = linkedWrap.getAttribute('data-map-linked-cell') ?? anchorCellId;
      return { type: 'cell', cellId };
    }
  }
  return null;
}

/**
 * Single winning interactive target for Select mode: same priority for hover preview and click.
 *
 * Priority: object / linked (DOM stack at client coords when provided) → single targetElement DOM →
 * edge (square geometry) → path (geometry) → draft interior via {@link resolveSelectModeAfterPathEdgeHits}.
 */
export function resolveSelectModeInteractiveTarget(
  p: ResolveSelectModeInteractiveTargetParams,
): LocationMapSelection {
  if (p.clientX != null && p.clientY != null) {
    const fromStack = pickDomMapSelectionFromStack(p.clientX, p.clientY, p.anchorCellId);
    if (fromStack) return fromStack;
  }

  const el = p.targetElement;
  if (el) {
    const objWrap = el.closest('[data-map-object-id]');
    if (objWrap) {
      const objectId = objWrap.getAttribute('data-map-object-id');
      const cellId = objWrap.getAttribute('data-map-object-cell-id') ?? p.anchorCellId;
      if (objectId) {
        return { type: 'object', cellId, objectId };
      }
    }
    const linkedWrap = el.closest('[data-map-linked-cell]');
    if (linkedWrap) {
      const cellId = linkedWrap.getAttribute('data-map-linked-cell') ?? p.anchorCellId;
      return { type: 'cell', cellId };
    }
  }

  if (!p.skipGeometry && !p.isHex && p.edgeGeoms && p.edgeGeoms.length > 0) {
    const edgeHit = resolveNearestEdgeHit(p.gx, p.gy, p.edgeGeoms, DEFAULT_EDGE_PICK_HALF_WIDTH_PX);
    if (edgeHit) {
      const sel = edgeHitToSelection(edgeHit, p.edgeEntries);
      if (sel) {
        return sel;
      }
    }
  }

  if (!p.skipGeometry) {
    const pathHit = resolveNearestPathHit(p.gx, p.gy, p.pathPolys, DEFAULT_PATH_PICK_TOLERANCE_PX);
    if (pathHit) {
      return { type: 'path', pathId: pathHit.pathId };
    }
  }

  return resolveSelectModeAfterPathEdgeHits(
    p.anchorCellId,
    p.objectsByCellId,
    p.linkedLocationByCellId,
    p.regionIdByCellId,
  );
}
