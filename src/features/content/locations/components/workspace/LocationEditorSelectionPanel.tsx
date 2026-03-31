import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { LocationMapSelection } from './locationEditorRail.types';
import {
  LocationCellAuthoringPanel,
  type LocationCellAuthoringPanelProps,
} from '../LocationCellAuthoringPanel';

export type LocationEditorSelectionPanelProps = {
  selection: LocationMapSelection;
  /** Passed through when `selection` is `cell` (same props the route already used for the cell inspector). */
  cellPanelProps: LocationCellAuthoringPanelProps;
};

/**
 * Right-rail **Selection** section: inspector for the current map selection.
 * - `none` / placeholders: lightweight copy only (no extra selection features in this slice).
 * - `cell`: existing {@link LocationCellAuthoringPanel}.
 */
export function LocationEditorSelectionPanel({
  selection,
  cellPanelProps,
}: LocationEditorSelectionPanelProps) {
  switch (selection.type) {
    case 'none':
      return (
        <Typography variant="body2" color="text.secondary">
          Select a cell, path, region, or object on the map.
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
      return (
        <PlaceholderMessage
          title="Path"
          body="Path inspector will be available in a future update."
        />
      );
    case 'object':
      return (
        <PlaceholderMessage
          title="Object"
          body="Object inspector will be available in a future update."
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
