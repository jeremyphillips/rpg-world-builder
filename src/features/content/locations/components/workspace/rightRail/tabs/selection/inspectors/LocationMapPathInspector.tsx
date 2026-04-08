import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

import type { LocationMapPathAuthoringEntry } from '@/shared/domain/locations';

import { SelectionRailTemplate } from '../templates/SelectionRailTemplate';

export type LocationMapPathInspectorProps = {
  pathId: string;
  pathEntries: readonly LocationMapPathAuthoringEntry[];
  /** When set, “Remove from map” removes the whole chain (same as map Delete for paths). */
  onRemovePathFromMap?: (pathId: string) => void;
};

export function LocationMapPathInspector({
  pathId,
  pathEntries,
  onRemovePathFromMap,
}: LocationMapPathInspectorProps) {
  const entry = pathEntries.find((p) => p.id === pathId);
  if (!entry) {
    return (
      <Typography variant="body2" color="text.secondary">
        This path is no longer on the map.
      </Typography>
    );
  }

  const metadata = <Chip size="small" label={entry.kind} variant="outlined" />;

  return (
    <SelectionRailTemplate
      categoryLabel="Map"
      title="Path"
      placementLine={`Chain · ${entry.cellIds.length} cell${entry.cellIds.length === 1 ? '' : 's'}`}
      metadata={metadata}
      onRemoveFromMap={onRemovePathFromMap ? () => onRemovePathFromMap(pathId) : undefined}
    />
  );
}
