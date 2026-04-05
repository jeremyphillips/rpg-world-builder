import type { EdgeSegmentGeometry } from '@/shared/domain/locations/map/locationMapGeometry.types';

import type { LocationMapUiResolvedStyles } from '@/features/content/locations/domain/mapPresentation/locationMapUiStyles';
import type { ResolvedEdgeTarget } from '@/features/content/locations/domain/mapEditor';
import type { LocationMapSelection } from '@/features/content/locations/components/workspace/rightRail/types';
import {
  squareEdgeSegmentPxFromEdgeId,
  SQUARE_GRID_GAP_PX,
} from '@/features/content/locations/components/authoring/geometry/squareGridMapOverlayGeometry';
import { LocationMapPathSvgPaths } from '@/features/content/locations/components/mapGrid/LocationMapPathSvgPaths';

type PathSvgItem = { pathId: string; kind: string; d: string };

export type SquareMapAuthoringSvgOverlayProps = {
  width: number;
  height: number;
  cellPx: number;
  mapUi: LocationMapUiResolvedStyles;
  pathSvgData: PathSvgItem[];
  mapSelection: LocationMapSelection;
  selectHoverTarget: LocationMapSelection;
  edgeStrokeSnapshot: string[];
  edgeHoverTarget: ResolvedEdgeTarget | null;
  edgeEraseActive: boolean;
  committedEdgeSegmentGeometry: EdgeSegmentGeometry[];
};

/**
 * Square grid: path splines, committed edges, boundary-paint preview stroke, and hover edge dash.
 * Pointer-events none; parent stacks **above** the cell grid so strokes/paths paint over terrain fill
 * (cells remain interactive; hit-testing targets elements under this SVG).
 */
export function SquareMapAuthoringSvgOverlay({
  width,
  height,
  cellPx,
  mapUi,
  pathSvgData,
  mapSelection,
  selectHoverTarget,
  edgeStrokeSnapshot,
  edgeHoverTarget,
  edgeEraseActive,
  committedEdgeSegmentGeometry,
}: SquareMapAuthoringSvgOverlayProps) {
  return (
    <svg
      width={width}
      height={height}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
      aria-hidden
    >
      {edgeStrokeSnapshot.map((eid) => {
        const seg = squareEdgeSegmentPxFromEdgeId(eid, cellPx, SQUARE_GRID_GAP_PX);
        if (!seg) return null;
        return (
          <line
            key={`stroke-${eid}`}
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            stroke={mapUi.edgeBoundaryPaint.stroke}
            strokeWidth={mapUi.edgeBoundaryPaint.strokeWidthPx}
            strokeLinecap="square"
            opacity={mapUi.edgeBoundaryPaint.opacity}
          />
        );
      })}
      {edgeHoverTarget &&
        !edgeStrokeSnapshot.includes(edgeHoverTarget.edgeId) &&
        (() => {
          const seg = squareEdgeSegmentPxFromEdgeId(
            edgeHoverTarget.edgeId,
            cellPx,
            SQUARE_GRID_GAP_PX,
          );
          if (!seg) return null;
          return (
            <line
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke={
                edgeEraseActive ? mapUi.edgeHover.strokeErase : mapUi.edgeHover.strokePlace
              }
              strokeWidth={mapUi.edgeHover.strokeWidthPx}
              strokeDasharray={mapUi.edgeHover.dasharray}
              strokeLinecap="square"
              opacity={mapUi.edgeHover.opacity}
            />
          );
        })()}
      <LocationMapPathSvgPaths
        pathSvgData={pathSvgData}
        mapUi={mapUi}
        mapSelection={mapSelection}
        selectHoverTarget={selectHoverTarget}
      />
      {committedEdgeSegmentGeometry.map((g) => {
        const st = mapUi.edgeCommittedStrokeByKind[g.kind];
        const seg = g.segment;
        const selected =
          (mapSelection.type === 'edge' && mapSelection.edgeId === g.edgeId) ||
          (mapSelection.type === 'edge-run' && mapSelection.edgeIds.includes(g.edgeId));
        const hovered =
          selectHoverTarget.type === 'edge-run' && selectHoverTarget.edgeIds.includes(g.edgeId);
        return (
          <line
            key={g.edgeId}
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            stroke={st.stroke}
            strokeWidth={
              selected || hovered
                ? st.strokeWidth + mapUi.tokens.edge.selectedStrokeWidthBoostPx
                : st.strokeWidth
            }
            strokeLinecap="square"
            {...('strokeDasharray' in st && st.strokeDasharray != null
              ? { strokeDasharray: st.strokeDasharray }
              : {})}
          />
        );
      })}
    </svg>
  );
}
