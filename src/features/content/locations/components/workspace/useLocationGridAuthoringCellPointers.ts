import { useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import type { GridCell } from '@/features/content/locations/components/mapGrid';

type PaintPointerHandler = (e: ReactPointerEvent<HTMLElement>, cell: GridCell) => void;

/**
 * Cell-level pointer wiring for the map authoring grid: paint/erase drag strokes (delegated to
 * {@link useLocationGridPaintStroke}), place-object drag stroke, path-placement hover preview, and
 * pan-suppression for edge/path place modes. Keeps {@link LocationGridAuthoringSection} as a mode
 * dispatcher for clicks without growing `handleCellPointerDown` inline.
 */
export function useLocationGridAuthoringCellPointers(args: {
  paintStrokeOrEraseFill: boolean;
  handlePaintPointerDown: PaintPointerHandler;
  handlePaintPointerEnter: PaintPointerHandler;
  handlePaintPointerUp: (e: ReactPointerEvent<HTMLElement>) => void;
  placeObjectStrokeMode: boolean;
  placePathPlacement: boolean;
  suppressEdgePlacePan: boolean;
  onPlaceCellClick?: (cellId: string) => void;
  /** After pointer release ends a drag-place stroke (including window pointerup outside a cell). */
  onPlaceObjectStrokeEnd?: () => void;
  resolveHexCellFromClient: (clientX: number, clientY: number) => string | null;
  setPlaceHoverCellId: Dispatch<SetStateAction<string | null>>;
}) {
  const {
    paintStrokeOrEraseFill,
    handlePaintPointerDown,
    handlePaintPointerEnter,
    handlePaintPointerUp,
    placeObjectStrokeMode,
    placePathPlacement,
    suppressEdgePlacePan,
    onPlaceCellClick,
    onPlaceObjectStrokeEnd,
    resolveHexCellFromClient,
    setPlaceHoverCellId,
  } = args;

  const placeObjectStrokeActive = useRef(false);
  const placeObjectStrokeSeen = useRef<Set<string>>(new Set());

  const endPlaceObjectStroke = useCallback(() => {
    const wasActive = placeObjectStrokeActive.current;
    placeObjectStrokeActive.current = false;
    placeObjectStrokeSeen.current.clear();
    if (wasActive) onPlaceObjectStrokeEnd?.();
  }, [onPlaceObjectStrokeEnd]);

  const handleCellPointerDownForGrid = useCallback(
    (e: ReactPointerEvent<HTMLElement>, cell: GridCell) => {
      if (paintStrokeOrEraseFill) {
        handlePaintPointerDown(e, cell);
        return;
      }
      if (placeObjectStrokeMode) {
        e.stopPropagation();
        placeObjectStrokeActive.current = true;
        placeObjectStrokeSeen.current = new Set();
        if (!placeObjectStrokeSeen.current.has(cell.cellId)) {
          placeObjectStrokeSeen.current.add(cell.cellId);
          onPlaceCellClick?.(cell.cellId);
        }
        return;
      }
      if (placePathPlacement) {
        e.stopPropagation();
        return;
      }
      if (suppressEdgePlacePan) {
        e.stopPropagation();
      }
    },
    [
      paintStrokeOrEraseFill,
      handlePaintPointerDown,
      placeObjectStrokeMode,
      onPlaceCellClick,
      placePathPlacement,
      suppressEdgePlacePan,
    ],
  );

  const updatePlaceHoverFromPointerClient = useCallback(
    (clientX: number, clientY: number) => {
      const top = document.elementFromPoint(clientX, clientY);
      const cellEl = top?.closest('[role="gridcell"]');
      const directId = cellEl?.getAttribute('data-cell-id') ?? null;
      const next = directId ?? resolveHexCellFromClient(clientX, clientY);
      setPlaceHoverCellId((prev) => (prev === next ? prev : next));
    },
    [resolveHexCellFromClient, setPlaceHoverCellId],
  );

  const handlePlacePathEdgePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!placePathPlacement) return;
      updatePlaceHoverFromPointerClient(e.clientX, e.clientY);
    },
    [placePathPlacement, updatePlaceHoverFromPointerClient],
  );

  const handleCellPointerEnterForGrid = useCallback(
    (e: ReactPointerEvent<HTMLElement>, cell: GridCell) => {
      if (paintStrokeOrEraseFill) {
        handlePaintPointerEnter(e, cell);
        return;
      }
      if (placePathPlacement) {
        e.stopPropagation();
        setPlaceHoverCellId(cell.cellId);
        return;
      }
      if (!placeObjectStrokeActive.current || !placeObjectStrokeMode) return;
      if (e.buttons !== 1) return;
      e.stopPropagation();
      if (placeObjectStrokeSeen.current.has(cell.cellId)) return;
      placeObjectStrokeSeen.current.add(cell.cellId);
      onPlaceCellClick?.(cell.cellId);
    },
    [
      paintStrokeOrEraseFill,
      handlePaintPointerEnter,
      placePathPlacement,
      placeObjectStrokeMode,
      onPlaceCellClick,
      setPlaceHoverCellId,
    ],
  );

  const handleCellPointerUpForGrid = useCallback(
    (e: ReactPointerEvent<HTMLElement>, cell: GridCell) => {
      void cell;
      if (paintStrokeOrEraseFill) {
        handlePaintPointerUp(e);
        return;
      }
      if (placeObjectStrokeActive.current && placeObjectStrokeMode) {
        e.stopPropagation();
        endPlaceObjectStroke();
        return;
      }
      if (placePathPlacement) {
        e.stopPropagation();
        return;
      }
      if (suppressEdgePlacePan) {
        e.stopPropagation();
      }
    },
    [
      paintStrokeOrEraseFill,
      handlePaintPointerUp,
      placeObjectStrokeMode,
      endPlaceObjectStroke,
      placePathPlacement,
      suppressEdgePlacePan,
    ],
  );

  return {
    placeObjectStrokeActive,
    endPlaceObjectStroke,
    handleCellPointerDownForGrid,
    handleCellPointerEnterForGrid,
    handleCellPointerUpForGrid,
    handlePlacePathEdgePointerMove,
  };
}
