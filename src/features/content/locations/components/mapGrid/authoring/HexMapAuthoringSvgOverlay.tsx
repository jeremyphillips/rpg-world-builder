import type { LineSegment2D } from '@/shared/domain/locations/map/locationMapGeometry.types';

import type { LocationMapUiResolvedStyles } from '@/features/content/locations/domain/mapPresentation/locationMapUiStyles';
import type { LocationMapSelection } from '@/features/content/locations/components/workspace/rightRail/types';
import { LocationMapPathSvgPaths } from '@/features/content/locations/components/mapGrid/LocationMapPathSvgPaths';

type PathSvgItem = { pathId: string; kind: string; d: string };

export type HexMapAuthoringSvgOverlayProps = {
  width: number;
  height: number;
  mapUi: LocationMapUiResolvedStyles;
  pathSvgData: PathSvgItem[];
  mapSelection: LocationMapSelection;
  selectHoverTarget: LocationMapSelection;
  hexSelectedRegionBoundarySegments: LineSegment2D[];
  hexHoverRegionBoundarySegments: LineSegment2D[];
};

/**
 * Hex grid: path splines and region boundary outlines (selection + hover).
 * Pointer-events none; rendered above the cell grid.
 */
export function HexMapAuthoringSvgOverlay({
  width,
  height,
  mapUi,
  pathSvgData,
  mapSelection,
  selectHoverTarget,
  hexSelectedRegionBoundarySegments,
  hexHoverRegionBoundarySegments,
}: HexMapAuthoringSvgOverlayProps) {
  return (
    <svg
      width={width}
      height={height}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        pointerEvents: 'none',
        zIndex: 2,
        display: 'block',
      }}
      aria-hidden
    >
      <LocationMapPathSvgPaths
        pathSvgData={pathSvgData}
        mapUi={mapUi}
        mapSelection={mapSelection}
        selectHoverTarget={selectHoverTarget}
      />
      {mapSelection.type === 'region' &&
        hexSelectedRegionBoundarySegments.map((seg, i) => (
          <line
            key={`hex-region-boundary-${i}-${seg.x1}-${seg.y1}-${seg.x2}-${seg.y2}`}
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
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
