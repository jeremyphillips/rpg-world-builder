import type { Dispatch, RefObject, SetStateAction } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';

import type { GridCell } from '@/features/content/locations/components/mapGrid';
import {
  buildSelectModeInteractiveTargetInput,
  buildSelectModeInteractiveTargetInputSkipGeometry,
  refineSelectModeClickAfterRegionDrill,
  resolveSelectModeInteractiveTarget,
  type LocationMapEditorMode,
} from '@/features/content/locations/domain/authoring/editor';
import type { LocationGridDraftState } from '../authoring/draft/locationGridDraft.types';
import type { LocationMapSelection } from './rightRail/types';
import { mapSelectionEqual, selectedCellIdForMapSelection } from './rightRail/locationEditorRail.helpers';
import {
  resolveSquareAnchorCellIdForSelectPx,
  SQUARE_GRID_GAP_PX,
} from '../authoring/geometry/squareGridMapOverlayGeometry';
import type {
  EdgeSegmentGeometry,
  PathPolylineGeometry,
} from '@/shared/domain/locations/map/locationMapGeometry.types';

type SquareGridGeometry = { cellPx: number; width: number; height: number };

type UseLocationGridSelectModeParams = {
  mapEditorMode: LocationMapEditorMode;
  validPreview: boolean;
  draft: LocationGridDraftState;
  setDraft: Dispatch<SetStateAction<LocationGridDraftState>>;
  pathPickPolys: readonly PathPolylineGeometry[];
  edgePickGeoms: readonly EdgeSegmentGeometry[] | null;
  isHex: boolean;
  squareGridGeometry: SquareGridGeometry | null;
  cols: number;
  rows: number;
  gridContainerRef: RefObject<HTMLDivElement | null>;
  resolveHexCellFromClient: (clientX: number, clientY: number) => string | null;
  consumeClickSuppressionAfterPan?: () => boolean;
  onCellFocusRail?: () => void;
};

/**
 * Select-mode hover resolution, gap clicks (square), and cell clicks for map selection.
 * Domain resolution stays in `domain/authoring/editor/selectMode`; this hook wires DOM + draft.
 */
export function useLocationGridSelectMode({
  mapEditorMode,
  validPreview,
  draft,
  setDraft,
  pathPickPolys,
  edgePickGeoms,
  isHex,
  squareGridGeometry,
  cols,
  rows,
  gridContainerRef,
  resolveHexCellFromClient,
  consumeClickSuppressionAfterPan,
  onCellFocusRail,
}: UseLocationGridSelectModeParams) {
  const [selectHoverTarget, setSelectHoverTarget] = useState<LocationMapSelection>({
    type: 'none',
  });

  useEffect(() => {
    if (mapEditorMode !== 'select') {
      setSelectHoverTarget({ type: 'none' });
    }
  }, [mapEditorMode]);

  const clearSelectHoverTarget = useCallback(() => {
    setSelectHoverTarget({ type: 'none' });
  }, []);

  const handleSelectPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (mapEditorMode !== 'select' || !validPreview) return;
      if (!gridContainerRef.current) return;
      const rect = gridContainerRef.current.getBoundingClientRect();
      const gx = e.clientX - rect.left;
      const gy = e.clientY - rect.top;
      const stack =
        typeof document !== 'undefined' && typeof document.elementsFromPoint === 'function'
          ? document.elementsFromPoint(e.clientX, e.clientY)
          : [];
      const top = stack[0] ?? null;
      const cellEl =
        top instanceof Element ? top.closest('[role="gridcell"]') : null;
      const firstGridCellInStack = stack.find(
        (n): n is HTMLElement =>
          n instanceof HTMLElement && n.getAttribute('role') === 'gridcell',
      );
      const anchorCellId =
        (isHex ? resolveHexCellFromClient(e.clientX, e.clientY) : null) ??
        cellEl?.getAttribute('data-cell-id') ??
        firstGridCellInStack?.getAttribute('data-cell-id') ??
        (!isHex && squareGridGeometry
          ? resolveSquareAnchorCellIdForSelectPx(
              gx,
              gy,
              squareGridGeometry.cellPx,
              cols,
              rows,
              SQUARE_GRID_GAP_PX,
            )
          : null);
      if (!anchorCellId) {
        setSelectHoverTarget((prev) =>
          mapSelectionEqual(prev, { type: 'none' }) ? prev : { type: 'none' },
        );
        return;
      }
      const next = resolveSelectModeInteractiveTarget({
        targetElement: top instanceof HTMLElement ? top : null,
        clientX: e.clientX,
        clientY: e.clientY,
        gx,
        gy,
        anchorCellId,
        ...buildSelectModeInteractiveTargetInput(draft, pathPickPolys, edgePickGeoms, isHex),
      });
      setSelectHoverTarget((prev) => (mapSelectionEqual(prev, next) ? prev : next));
    },
    [
      mapEditorMode,
      validPreview,
      draft,
      pathPickPolys,
      edgePickGeoms,
      isHex,
      squareGridGeometry,
      cols,
      rows,
      resolveHexCellFromClient,
      gridContainerRef,
    ],
  );

  const handleSelectGridContainerClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (mapEditorMode !== 'select' || !validPreview) return;
      if (consumeClickSuppressionAfterPan?.()) return;
      if (isHex) return;
      if ((e.target as HTMLElement).closest('[role="gridcell"]')) return;
      if (!gridContainerRef.current || !squareGridGeometry) return;
      const rect = gridContainerRef.current.getBoundingClientRect();
      const gx = e.clientX - rect.left;
      const gy = e.clientY - rect.top;
      const anchorCellId = resolveSquareAnchorCellIdForSelectPx(
        gx,
        gy,
        squareGridGeometry.cellPx,
        cols,
        rows,
        SQUARE_GRID_GAP_PX,
      );
      if (!anchorCellId) return;
      setDraft((d) => {
        const resolved = resolveSelectModeInteractiveTarget({
          targetElement: e.target as HTMLElement,
          clientX: e.clientX,
          clientY: e.clientY,
          gx,
          gy,
          anchorCellId,
          ...buildSelectModeInteractiveTargetInput(d, pathPickPolys, edgePickGeoms, isHex),
        });
        const ms = refineSelectModeClickAfterRegionDrill(resolved, d.mapSelection, anchorCellId);
        return {
          ...d,
          mapSelection: ms,
          selectedCellId: selectedCellIdForMapSelection(ms),
        };
      });
      onCellFocusRail?.();
    },
    [
      mapEditorMode,
      validPreview,
      consumeClickSuppressionAfterPan,
      isHex,
      squareGridGeometry,
      cols,
      rows,
      pathPickPolys,
      edgePickGeoms,
      setDraft,
      onCellFocusRail,
      gridContainerRef,
    ],
  );

  const onSelectModeCellClick = useCallback(
    (cell: GridCell, e: ReactMouseEvent<HTMLElement>) => {
      if (!gridContainerRef.current) {
        setDraft((d) => {
          const resolved = resolveSelectModeInteractiveTarget({
            targetElement: e.target as HTMLElement,
            clientX: e.clientX,
            clientY: e.clientY,
            gx: 0,
            gy: 0,
            anchorCellId: cell.cellId,
            ...buildSelectModeInteractiveTargetInputSkipGeometry(d, isHex),
          });
          const ms = refineSelectModeClickAfterRegionDrill(resolved, d.mapSelection, cell.cellId);
          return {
            ...d,
            mapSelection: ms,
            selectedCellId: selectedCellIdForMapSelection(ms),
          };
        });
        onCellFocusRail?.();
        return;
      }
      const rect = gridContainerRef.current.getBoundingClientRect();
      const gx = e.clientX - rect.left;
      const gy = e.clientY - rect.top;
      setDraft((d) => {
        const resolved = resolveSelectModeInteractiveTarget({
          targetElement: e.target as HTMLElement,
          clientX: e.clientX,
          clientY: e.clientY,
          gx,
          gy,
          anchorCellId: cell.cellId,
          ...buildSelectModeInteractiveTargetInput(d, pathPickPolys, edgePickGeoms, isHex),
        });
        const ms = refineSelectModeClickAfterRegionDrill(resolved, d.mapSelection, cell.cellId);
        return {
          ...d,
          mapSelection: ms,
          selectedCellId: selectedCellIdForMapSelection(ms),
        };
      });
      onCellFocusRail?.();
    },
    [
      isHex,
      pathPickPolys,
      edgePickGeoms,
      setDraft,
      onCellFocusRail,
      gridContainerRef,
    ],
  );

  return {
    selectHoverTarget,
    clearSelectHoverTarget,
    handleSelectPointerMove,
    handleSelectGridContainerClick,
    onSelectModeCellClick,
  };
}
