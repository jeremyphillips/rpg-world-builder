import { useEffect, type Dispatch, type SetStateAction } from 'react';

import { parseGridCellId } from '@/shared/domain/grid/gridCellIds';
import {
  pruneCellKeyedRecordForGrid,
  pruneExcludedCellIdsForGrid,
} from '@/features/content/locations/domain/authoring/map/gridLayoutDraft';
import type { LocationGridDraftState } from '@/features/content/locations/components/authoring/draft/locationGridDraft.types';
import { selectedCellIdForMapSelection } from '@/features/content/locations/components/workspace/rightRail/types';
import { isSquareEdgeIdInBoundsForGrid } from '@/shared/domain/grid/gridEdgeIds';

export function usePruneGridDraftOnDimensionChange(
  validPreview: boolean,
  cols: number,
  rows: number,
  setDraft: Dispatch<SetStateAction<LocationGridDraftState>>,
): void {
  useEffect(() => {
    if (!validPreview) return;
    setDraft((prev) => {
      const prunedExcluded = pruneExcludedCellIdsForGrid(prev.excludedCellIds, cols, rows);
      const prunedLinks = pruneCellKeyedRecordForGrid(prev.linkedLocationByCellId, cols, rows);
      const prunedObjs = pruneCellKeyedRecordForGrid(prev.objectsByCellId, cols, rows);
      const prunedFill = pruneCellKeyedRecordForGrid(prev.cellFillByCellId, cols, rows);
      const prunedRegion = pruneCellKeyedRecordForGrid(prev.regionIdByCellId, cols, rows);
      const cellInBounds = (cellId: string) => {
        const p = parseGridCellId(cellId);
        if (!p) return false;
        return p.x >= 0 && p.y >= 0 && p.x < cols && p.y < rows;
      };
      const prunedPaths = prev.pathEntries.filter((pe) =>
        pe.cellIds.every((cid) => cellInBounds(cid.trim())),
      );
      const prunedEdges = prev.edgeEntries.filter((e) =>
        isSquareEdgeIdInBoundsForGrid(e.edgeId, cols, rows),
      );

      let nextMapSelection = prev.mapSelection;
      const ms = prev.mapSelection;
      if (ms.type === 'cell') {
        if (!cellInBounds(ms.cellId)) {
          nextMapSelection = { type: 'none' };
        }
      } else if (ms.type === 'object') {
        if (!cellInBounds(ms.cellId)) {
          nextMapSelection = { type: 'none' };
        } else {
          const objs = prunedObjs[ms.cellId];
          if (!objs?.some((o) => o.id === ms.objectId)) {
            nextMapSelection = { type: 'none' };
          }
        }
      } else if (ms.type === 'path') {
        if (!prunedPaths.some((p) => p.id === ms.pathId)) {
          nextMapSelection = { type: 'none' };
        }
      } else if (ms.type === 'edge') {
        if (!prunedEdges.some((e) => e.edgeId === ms.edgeId)) {
          nextMapSelection = { type: 'none' };
        }
      } else if (ms.type === 'edge-run') {
        const allPresent = ms.edgeIds.every((id) =>
          prunedEdges.some((e) => e.edgeId === id),
        );
        if (!allPresent) {
          nextMapSelection = { type: 'none' };
        }
      } else if (ms.type === 'region') {
        if (!prev.regionEntries.some((r) => r.id === ms.regionId)) {
          nextMapSelection = { type: 'none' };
        }
      }

      const sameLen = prunedExcluded.length === prev.excludedCellIds.length;
      const sameIds =
        sameLen && prunedExcluded.every((id, i) => id === prev.excludedCellIds[i]);
      const linksSame =
        JSON.stringify(prunedLinks) === JSON.stringify(prev.linkedLocationByCellId);
      const objsSame =
        JSON.stringify(prunedObjs) === JSON.stringify(prev.objectsByCellId);
      const fillSame =
        JSON.stringify(prunedFill) === JSON.stringify(prev.cellFillByCellId);
      const regionSame =
        JSON.stringify(prunedRegion) === JSON.stringify(prev.regionIdByCellId);
      const pathsSame = JSON.stringify(prunedPaths) === JSON.stringify(prev.pathEntries);
      const edgesSame = JSON.stringify(prunedEdges) === JSON.stringify(prev.edgeEntries);
      const mapSelSame =
        JSON.stringify(nextMapSelection) === JSON.stringify(prev.mapSelection);
      const nextSelectedCellId = selectedCellIdForMapSelection(nextMapSelection);
      if (
        sameIds &&
        nextSelectedCellId === prev.selectedCellId &&
        linksSame &&
        objsSame &&
        fillSame &&
        regionSame &&
        pathsSame &&
        edgesSame &&
        mapSelSame
      ) {
        return prev;
      }
      return {
        ...prev,
        mapSelection: nextMapSelection,
        excludedCellIds: prunedExcluded,
        selectedCellId: nextSelectedCellId,
        linkedLocationByCellId: prunedLinks,
        objectsByCellId: prunedObjs,
        cellFillByCellId: prunedFill,
        regionIdByCellId: prunedRegion,
        regionEntries: prev.regionEntries,
        pathEntries: prunedPaths,
        edgeEntries: prunedEdges,
      };
    });
  }, [validPreview, cols, rows, setDraft]);
}
