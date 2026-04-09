import type { LineSegment2D } from '@/shared/domain/locations/map/locationMapGeometry.types';

import type { LocationMapUiResolvedStyles } from '@/features/content/locations/domain/presentation/map/locationMapUiStyles';
import type { LocationMapSelection } from '@/features/content/locations/components/workspace/rightRail/types';
import { LocationMapPathSvgPaths } from '@/features/content/locations/components/mapGrid/LocationMapPathSvgPaths';

type PathSvgItem = { pathId: string; kind: string; d: string };

export type HexMapAuthoringPathSvgOverlayProps = {
  width: number;
  height: number;
  mapUi: LocationMapUiResolvedStyles;
  hostScale: string;
  pathSvgData: PathSvgItem[];
  mapSelection: LocationMapSelection;
  selectHoverTarget: LocationMapSelection;
};

/**
 * Hex grid: path splines only. Parent wrapper uses `MAP_AUTHORING_LAYER_Z.hexPathsOverGrid`
 * (`mapAuthoringLayerZ.ts` / `locationGridAuthoringMapOverlayLayers`) so strokes stay above
 * tessellated cells — hex has no inter-cell gaps unlike square maps.
 */
export function HexMapAuthoringPathSvgOverlay({
  width,
  height,
  mapUi,
  hostScale,
  pathSvgData,
  mapSelection,
  selectHoverTarget,
}: HexMapAuthoringPathSvgOverlayProps) {
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
      <LocationMapPathSvgPaths
        pathSvgData={pathSvgData}
        mapUi={mapUi}
        hostScale={hostScale}
        mapSelection={mapSelection}
        selectHoverTarget={selectHoverTarget}
      />
    </svg>
  );
}

export type HexMapAuthoringRegionSvgOverlayProps = {
  width: number;
  height: number;
  mapUi: LocationMapUiResolvedStyles;
  mapSelection: LocationMapSelection;
  selectHoverTarget: LocationMapSelection;
  hexSelectedRegionBoundarySegments: LineSegment2D[];
  hexHoverRegionBoundarySegments: LineSegment2D[];
};

/**
 * Hex grid: region hull outlines (selection + hover). Stacks **above** the cell grid so boundaries stay readable.
 */
export function HexMapAuthoringRegionSvgOverlay({
  width,
  height,
  mapUi,
  mapSelection,
  selectHoverTarget,
  hexSelectedRegionBoundarySegments,
  hexHoverRegionBoundarySegments,
}: HexMapAuthoringRegionSvgOverlayProps) {
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
      {mapSelection.type === 'region' &&
        hexSelectedRegionBoundarySegments.map((seg, i) => (
          <line
            key={`hex-region-boundary-${i}-${seg.x1}-${seg.y1}-${seg.x2}-${seg.y2}`}
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            pointerEvents="none"
            fill="none"
            stroke={mapUi.regionSelectedOutline.stroke}
            strokeWidth={mapUi.regionSelectedOutline.strokeWidthPx}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      {selectHoverTarget.type === 'region' &&
        !(mapSelection.type === 'region' && mapSelection.regionId === selectHoverTarget.regionId) &&
        hexHoverRegionBoundarySegments.map((seg, i) => (
          <line
            key={`hex-region-hover-${i}-${seg.x1}-${seg.y1}-${seg.x2}-${seg.y2}`}
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            pointerEvents="none"
            fill="none"
            stroke={mapUi.regionSelectedOutline.stroke}
            strokeWidth={mapUi.regionSelectedOutline.strokeWidthPx}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.65}
          />
        ))}
    </svg>
  );
}
