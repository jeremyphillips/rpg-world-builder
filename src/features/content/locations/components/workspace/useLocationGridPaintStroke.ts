import { useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

import {
  canApplyAnyPaintStroke,
  canApplyRegionPaint,
  getActiveSurfaceFillSelection,
  type LocationMapActivePaintSelection,
  type LocationMapEditorMode,
} from '@/features/content/locations/domain/authoring/editor';
import type { GridCell } from '@/features/content/locations/components/mapGrid';
import type { LocationGridDraftState } from '@/features/content/locations/components/authoring/draft/locationGridDraft.types';
import type { Dispatch, SetStateAction } from 'react';

type UseLocationGridPaintStrokeParams = {
  mapEditorMode: LocationMapEditorMode;
  activePaint: LocationMapActivePaintSelection | null;
  regionEntries: LocationGridDraftState['regionEntries'];
  setDraft: Dispatch<SetStateAction<LocationGridDraftState>>;
};

/**
 * Paint / erase-fill drag stroke across cells (terrain + region paint, or bulk erase of fills).
 * Component-owned pointer wiring for {@link LocationGridAuthoringSection}; domain rules stay in
 * `domain/authoring/editor`.
 */
export function useLocationGridPaintStroke({
  mapEditorMode,
  activePaint,
  regionEntries,
  setDraft,
}: UseLocationGridPaintStrokeParams) {
  const paintStrokeActive = useRef(false);
  const strokeSeen = useRef<Set<string>>(new Set());

  const applyStrokeCell = useCallback(
    (cellId: string) => {
      if (strokeSeen.current.has(cellId)) return;
      strokeSeen.current.add(cellId);
      if (mapEditorMode === 'paint') {
        const surfaceFill = getActiveSurfaceFillSelection(activePaint ?? null);
        if (surfaceFill) {
          setDraft((d) => ({
            ...d,
            cellFillByCellId: { ...d.cellFillByCellId, [cellId]: { ...surfaceFill } },
          }));
          return;
        }
        if (canApplyRegionPaint(activePaint ?? null, regionEntries)) {
          const paint = activePaint!;
          const rid = paint.activeRegionId!.trim();
          setDraft((prevDraft) => ({
            ...prevDraft,
            regionIdByCellId: { ...prevDraft.regionIdByCellId, [cellId]: rid },
          }));
        }
        return;
      }
      if (mapEditorMode === 'erase') {
        setDraft((d) => {
          const nextFill = { ...d.cellFillByCellId };
          delete nextFill[cellId];
          const nextRegion = { ...d.regionIdByCellId };
          delete nextRegion[cellId];
          return { ...d, cellFillByCellId: nextFill, regionIdByCellId: nextRegion };
        });
      }
    },
    [activePaint, regionEntries, mapEditorMode, setDraft],
  );

  const endPaintStroke = useCallback(() => {
    paintStrokeActive.current = false;
    strokeSeen.current.clear();
  }, []);

  const handlePaintPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>, cell: GridCell) => {
      if (mapEditorMode !== 'paint' && mapEditorMode !== 'erase') return;
      if (mapEditorMode === 'paint' && !canApplyAnyPaintStroke(activePaint ?? null, regionEntries)) {
        return;
      }
      e.stopPropagation();
      paintStrokeActive.current = true;
      strokeSeen.current = new Set();
      applyStrokeCell(cell.cellId);
    },
    [activePaint, applyStrokeCell, regionEntries, mapEditorMode],
  );

  const handlePaintPointerEnter = useCallback(
    (e: ReactPointerEvent<HTMLElement>, cell: GridCell) => {
      if (!paintStrokeActive.current) return;
      if (e.buttons !== 1) return;
      if (mapEditorMode === 'paint' && !canApplyAnyPaintStroke(activePaint ?? null, regionEntries)) {
        return;
      }
      e.stopPropagation();
      applyStrokeCell(cell.cellId);
    },
    [activePaint, applyStrokeCell, regionEntries, mapEditorMode],
  );

  const handlePaintPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (mapEditorMode !== 'paint' && mapEditorMode !== 'erase') return;
      e.stopPropagation();
      endPaintStroke();
    },
    [endPaintStroke, mapEditorMode],
  );

  return {
    paintStrokeActive,
    endPaintStroke,
    handlePaintPointerDown,
    handlePaintPointerEnter,
    handlePaintPointerUp,
  };
}
