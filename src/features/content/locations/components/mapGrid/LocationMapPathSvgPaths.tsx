import type { LocationMapUiResolvedStyles } from '@/features/content/locations/domain/presentation/map/locationMapUiStyles';
import type { LocationMapSelection } from '@/features/content/locations/components/workspace/rightRail/types';

type PathSvgItem = {
  pathId: string;
  kind: string;
  d: string;
};

type LocationMapPathSvgPathsProps = {
  pathSvgData: PathSvgItem[];
  mapUi: LocationMapUiResolvedStyles;
  mapSelection: LocationMapSelection;
  selectHoverTarget: LocationMapSelection;
};

export function LocationMapPathSvgPaths({
  pathSvgData,
  mapUi,
  mapSelection,
  selectHoverTarget,
}: LocationMapPathSvgPathsProps) {
  return (
    <>
      {pathSvgData.map((p) => (
        <path
          key={`path-${p.pathId}`}
          d={p.d}
          fill="none"
          stroke={mapUi.path.stroke}
          strokeWidth={
            p.pathId !== '__preview__' &&
            ((mapSelection.type === 'path' && mapSelection.pathId === p.pathId) ||
              (selectHoverTarget.type === 'path' && selectHoverTarget.pathId === p.pathId))
              ? mapUi.path.selectedStrokeWidthPx
              : mapUi.path.defaultStrokeWidthPx
          }
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </>
  );
}
