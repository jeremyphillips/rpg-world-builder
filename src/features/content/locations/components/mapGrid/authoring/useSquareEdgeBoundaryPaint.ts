import { useCallback, useEffect, useRef, useState, type MutableRefObject, type RefObject } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

import type { LocationEdgeFeatureKindId } from '@/features/content/locations/domain/mapContent/locationEdgeFeature.types';
import {
  getSquareEdgeOrientation,
  resolveEdgeTargetFromGridPosition,
  shouldAcceptStrokeEdge,
  type EdgeOrientation,
  type LocationMapActiveDrawSelection,
  type ResolvedEdgeTarget,
} from '@/features/content/locations/domain/mapEditor';

import { SQUARE_GRID_GAP_PX } from '@/features/content/locations/components/authoring/geometry/squareGridMapOverlayGeometry';

const GRID_GAP_PX = SQUARE_GRID_GAP_PX;

export type UseSquareEdgeBoundaryPaintParams = {
  gridContainerRef: RefObject<HTMLDivElement | null>;
  squareGridGeometry: { cellPx: number } | null;
  cols: number;
  rows: number;
  edgePlaceActive: boolean;
  edgeEraseActive: boolean;
  activeDraw: LocationMapActiveDrawSelection | null | undefined;
  onEdgeStrokeCommit?: (edgeIds: string[], edgeKind: LocationEdgeFeatureKindId) => void;
  onEraseEdge?: (edgeId: string) => void;
};

export type UseSquareEdgeBoundaryPaintResult = {
  edgeHoverTarget: ResolvedEdgeTarget | null;
  edgeStrokeSnapshot: string[];
  /** True while a place-edge stroke is in progress (for window `pointerup` safety). */
  edgeStrokeActive: MutableRefObject<boolean>;
  commitEdgeStroke: () => void;
  handleEdgePointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
  handleEdgePointerMove: (e: ReactPointerEvent<HTMLElement>) => void;
  handleEdgePointerUp: (e: ReactPointerEvent<HTMLElement>) => void;
  handleEdgePointerLeave: () => void;
};

/**
 * Square grid only: boundary hover, place-edge stroke (capture pointers), erase-edge hit.
 * Shift key tracking for axis unlock lives here.
 */
export function useSquareEdgeBoundaryPaint({
  gridContainerRef,
  squareGridGeometry,
  cols,
  rows,
  edgePlaceActive,
  edgeEraseActive,
  activeDraw,
  onEdgeStrokeCommit,
  onEraseEdge,
}: UseSquareEdgeBoundaryPaintParams): UseSquareEdgeBoundaryPaintResult {
  const [edgeHoverTarget, setEdgeHoverTarget] = useState<ResolvedEdgeTarget | null>(null);
  const edgeStrokeActive = useRef(false);
  const edgeStrokeSeen = useRef<Set<string>>(new Set());
  const edgeStrokeEdgeIds = useRef<string[]>([]);
  const [edgeStrokeSnapshot, setEdgeStrokeSnapshot] = useState<string[]>([]);
  const edgeStrokeLockedAxis = useRef<EdgeOrientation | null>(null);
  const edgeStrokeLastTarget = useRef<ResolvedEdgeTarget | null>(null);
  const shiftHeld = useRef(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftHeld.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftHeld.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const commitEdgeStroke = useCallback(() => {
    const ids = edgeStrokeEdgeIds.current;
    if (ids.length > 0 && activeDraw?.category === 'edge') {
      onEdgeStrokeCommit?.(ids, activeDraw.kind);
    }
    edgeStrokeActive.current = false;
    edgeStrokeSeen.current.clear();
    edgeStrokeEdgeIds.current = [];
    edgeStrokeLockedAxis.current = null;
    edgeStrokeLastTarget.current = null;
    setEdgeStrokeSnapshot([]);
  }, [activeDraw, onEdgeStrokeCommit]);

  const resolveEdgeFromClient = useCallback(
    (clientX: number, clientY: number): ResolvedEdgeTarget | null => {
      if (!squareGridGeometry || !gridContainerRef.current) return null;
      const rect = gridContainerRef.current.getBoundingClientRect();
      const gx = clientX - rect.left;
      const gy = clientY - rect.top;
      return resolveEdgeTargetFromGridPosition(
        gx,
        gy,
        squareGridGeometry.cellPx,
        GRID_GAP_PX,
        cols,
        rows,
      );
    },
    [squareGridGeometry, cols, rows, gridContainerRef],
  );

  const handleEdgePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!edgePlaceActive && !edgeEraseActive) return;
      e.stopPropagation();

      const target = resolveEdgeFromClient(e.clientX, e.clientY);
      setEdgeHoverTarget((prev) =>
        prev?.edgeId === target?.edgeId ? prev : target,
      );

      if (edgeStrokeActive.current && target) {
        if (edgeStrokeSeen.current.has(target.edgeId)) return;

        const last = edgeStrokeLastTarget.current;
        if (last) {
          const { accept, newAxis } = shouldAcceptStrokeEdge(
            target,
            last,
            edgeStrokeLockedAxis.current,
            shiftHeld.current,
          );
          if (!accept) return;
          edgeStrokeLockedAxis.current = newAxis;
        }

        edgeStrokeSeen.current.add(target.edgeId);
        edgeStrokeEdgeIds.current.push(target.edgeId);
        edgeStrokeLastTarget.current = target;
        setEdgeStrokeSnapshot([...edgeStrokeEdgeIds.current]);
      }
    },
    [edgePlaceActive, edgeEraseActive, resolveEdgeFromClient],
  );

  const handleEdgePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      e.stopPropagation();
      if (edgePlaceActive) {
        const target = resolveEdgeFromClient(e.clientX, e.clientY);
        if (!target) return;
        edgeStrokeActive.current = true;
        edgeStrokeSeen.current = new Set([target.edgeId]);
        edgeStrokeEdgeIds.current = [target.edgeId];
        edgeStrokeLockedAxis.current = getSquareEdgeOrientation(target.side);
        edgeStrokeLastTarget.current = target;
        setEdgeStrokeSnapshot([target.edgeId]);
        return;
      }
      if (edgeEraseActive) {
        const target = resolveEdgeFromClient(e.clientX, e.clientY);
        if (target) {
          onEraseEdge?.(target.edgeId);
        }
      }
    },
    [edgePlaceActive, edgeEraseActive, resolveEdgeFromClient, onEraseEdge],
  );

  const handleEdgePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (edgeStrokeActive.current) {
        e.stopPropagation();
        commitEdgeStroke();
      }
    },
    [commitEdgeStroke],
  );

  const handleEdgePointerLeave = useCallback(() => {
    setEdgeHoverTarget(null);
  }, []);

  return {
    edgeHoverTarget,
    edgeStrokeSnapshot,
    edgeStrokeActive,
    commitEdgeStroke,
    handleEdgePointerDown,
    handleEdgePointerMove,
    handleEdgePointerUp,
    handleEdgePointerLeave,
  };
}
