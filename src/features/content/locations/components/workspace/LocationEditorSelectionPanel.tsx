import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { LocationMapEdgeAuthoringEntry, LocationMapPathAuthoringEntry } from '@/shared/domain/locations';

import type { LocationMapSelection } from './locationEditorRail.types';
import {
  LocationMapEdgeInspector,
  LocationMapEdgeRunInspector,
  LocationMapObjectInspector,
  LocationMapPathInspector,
} from './LocationMapSelectionInspectors';
import {
  LocationCellAuthoringPanel,
  type LocationCellAuthoringPanelProps,
} from '../LocationCellAuthoringPanel';

export type LocationEditorSelectionPanelProps = {
  selection: LocationMapSelection;
  /** Passed through for `cell` (same props the route already used for the cell inspector). */
  cellPanelProps: LocationCellAuthoringPanelProps;
  pathEntries: readonly LocationMapPathAuthoringEntry[];
  edgeEntries: readonly LocationMapEdgeAuthoringEntry[];
};

/**
 * Right-rail **Selection** section: inspector for the current map selection.
 */
export function LocationEditorSelectionPanel({
  selection,
  cellPanelProps,
  pathEntries,
  edgeEntries,
}: LocationEditorSelectionPanelProps) {
  switch (selection.type) {
    case 'none':
      return (
        <Typography variant="body2" color="text.secondary">
          Select a cell, path, edge, or object on the map.
        </Typography>
      );
    case 'cell':
      return (
        <LocationCellAuthoringPanel {...cellPanelProps} selectedCellId={selection.cellId} />
      );
    case 'region':
      return (
        <PlaceholderMessage
          title="Region"
          body="Region inspector will be available in a future update."
        />
      );
    case 'path':
      return <LocationMapPathInspector pathId={selection.pathId} pathEntries={pathEntries} />;
    case 'object':
      return (
        <LocationMapObjectInspector
          cellId={selection.cellId}
          objectId={selection.objectId}
          objectsByCellId={cellPanelProps.objectsByCellId}
          onUpdateCellObjects={cellPanelProps.onUpdateCellObjects}
        />
      );
    case 'edge':
      return <LocationMapEdgeInspector edgeId={selection.edgeId} edgeEntries={edgeEntries} />;
    case 'edge-run':
      return (
        <LocationMapEdgeRunInspector
          kind={selection.kind}
          edgeIds={selection.edgeIds}
          axis={selection.axis}
          anchorEdgeId={selection.anchorEdgeId}
        />
      );
  }
}

function PlaceholderMessage({ title, body }: { title: string; body: string }) {
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {body}
      </Typography>
    </Box>
  );
}
