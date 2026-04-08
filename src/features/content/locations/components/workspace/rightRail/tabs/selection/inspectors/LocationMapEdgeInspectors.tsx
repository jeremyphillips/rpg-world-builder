import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { LocationMapEdgeAuthoringEntry } from '@/shared/domain/locations';
import { resolveAuthoredEdgeInstance } from '@/features/content/locations/domain';

import type { LocationMapEdgeKindId } from '@/shared/domain/locations/map/locationMapEdgeFeature.constants';

import { EdgeLabelField } from '../fields/edgeLabelField';
import {
  SelectionMetadataRows,
  SelectionRailTemplate,
} from '../templates/SelectionRailTemplate';
import { formatEdgePlacementLine, presentationRowsFromPresentation } from '../selectionRail.helpers';

export type LocationMapEdgeInspectorProps = {
  edgeId: string;
  edgeEntries: readonly LocationMapEdgeAuthoringEntry[];
  /** When set, “Remove from map” uses the same draft path as Erase on that edge. */
  onRemoveEdgeFromMap?: (edgeId: string) => void;
  onPatchEdgeEntry?: (
    edgeId: string,
    patch: Partial<Pick<LocationMapEdgeAuthoringEntry, 'label'>>,
  ) => void;
};

export function LocationMapEdgeInspector({
  edgeId,
  edgeEntries,
  onRemoveEdgeFromMap,
  onPatchEdgeEntry,
}: LocationMapEdgeInspectorProps) {
  const entry = edgeEntries.find((e) => e.edgeId === edgeId);
  if (!entry) {
    return (
      <Typography variant="body2" color="text.secondary">
        This edge is no longer on the map.
      </Typography>
    );
  }

  const resolved = resolveAuthoredEdgeInstance(entry);
  const isDoorOrWindow = resolved.placedKind === 'door' || resolved.placedKind === 'window';
  const placementLine = formatEdgePlacementLine(edgeId);

  const presentationRows = isDoorOrWindow
    ? presentationRowsFromPresentation(resolved.presentation)
    : [];

  const metadata = isDoorOrWindow ? (
    <Stack spacing={1}>
      <SelectionMetadataRows rows={presentationRows} />
      {resolved.legacyIdentityFallback ? (
        <Typography variant="caption" color="text.secondary">
          This segment predates saved door/window identity — metadata uses the default variant until you re-place or
          the map is saved with upgraded edge data.
        </Typography>
      ) : null}
    </Stack>
  ) : (
    <Typography variant="body2" color="text.secondary">
      Boundary wall segment.
    </Typography>
  );

  const edgeLabelField = isDoorOrWindow ? (
    <EdgeLabelField
      value={entry.label ?? ''}
      onChange={(value) => onPatchEdgeEntry?.(edgeId, { label: value })}
    />
  ) : undefined;

  return (
    <SelectionRailTemplate
      categoryLabel={resolved.categoryLabel}
      title={resolved.objectTitle}
      placementLine={placementLine}
      metadata={metadata}
      onRemoveFromMap={onRemoveEdgeFromMap ? () => onRemoveEdgeFromMap(edgeId) : undefined}
    >
      {edgeLabelField}
    </SelectionRailTemplate>
  );
}

const EDGE_RUN_AXIS_LABEL: Record<'horizontal' | 'vertical', string> = {
  horizontal: 'Horizontal',
  vertical: 'Vertical',
};

function edgeRunHumanLabel(kind: LocationMapEdgeKindId, axis: 'horizontal' | 'vertical'): string {
  const axisLabel = EDGE_RUN_AXIS_LABEL[axis];
  const kindLabel = kind.charAt(0).toUpperCase() + kind.slice(1);
  return `${axisLabel} ${kindLabel} run`;
}

export type LocationMapEdgeRunInspectorProps = {
  kind: LocationMapEdgeKindId;
  edgeIds: readonly string[];
  axis: 'horizontal' | 'vertical';
  anchorEdgeId: string;
  edgeEntries: readonly LocationMapEdgeAuthoringEntry[];
  /** When set, removes every segment in this run (same as map Delete for edge-run). */
  onRemoveEdgeRunFromMap?: (edgeIds: readonly string[]) => void;
  onPatchEdgeEntry?: (
    edgeId: string,
    patch: Partial<Pick<LocationMapEdgeAuthoringEntry, 'label'>>,
  ) => void;
};

export function LocationMapEdgeRunInspector({
  kind,
  edgeIds,
  axis,
  anchorEdgeId,
  edgeEntries,
  onRemoveEdgeRunFromMap,
  onPatchEdgeEntry,
}: LocationMapEdgeRunInspectorProps) {
  const anchorEntry =
    edgeEntries.find((e) => e.edgeId === anchorEdgeId) ?? ({ edgeId: anchorEdgeId, kind } as LocationMapEdgeAuthoringEntry);

  const resolved = resolveAuthoredEdgeInstance(anchorEntry);
  const isDoorOrWindow = resolved.placedKind === 'door' || resolved.placedKind === 'window';
  const objectTitle = isDoorOrWindow
    ? resolved.objectTitle
    : edgeRunHumanLabel(kind, axis);
  const categoryLabel = isDoorOrWindow ? resolved.categoryLabel : 'Structure';

  /** Object-first: anchor placement is primary for door/window; wall runs stay geometry-forward. */
  const placementLine = isDoorOrWindow
    ? formatEdgePlacementLine(anchorEdgeId)
    : `Straight run · ${edgeIds.length} segment${edgeIds.length === 1 ? '' : 's'}`;

  const presentationRows = isDoorOrWindow
    ? presentationRowsFromPresentation(resolved.presentation)
    : [];

  const metadataEdgeRun = isDoorOrWindow ? (
    <Stack spacing={1}>
      <SelectionMetadataRows rows={presentationRows} />
      {resolved.legacyIdentityFallback ? (
        <Typography variant="caption" color="text.secondary">
          Anchor segment predates saved door/window identity — metadata uses the default variant until re-placed or
          upgraded on save.
        </Typography>
      ) : null}
    </Stack>
  ) : (
    <Stack spacing={1}>
      <Typography variant="body2" color="text.secondary">
        {edgeIds.length} segment{edgeIds.length === 1 ? '' : 's'} on this straight run
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Orientation: {axis} (square grid: {axis === 'horizontal' ? 'row' : 'column'} boundary line)
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Anchor: {formatEdgePlacementLine(anchorEdgeId)}
      </Typography>
    </Stack>
  );

  const edgeLabelField = isDoorOrWindow ? (
    <EdgeLabelField
      value={anchorEntry.label ?? ''}
      onChange={(value) => onPatchEdgeEntry?.(anchorEdgeId, { label: value })}
    />
  ) : undefined;

  return (
    <SelectionRailTemplate
      categoryLabel={categoryLabel}
      title={objectTitle}
      placementLine={placementLine}
      metadata={metadataEdgeRun}
      onRemoveFromMap={onRemoveEdgeRunFromMap ? () => onRemoveEdgeRunFromMap(edgeIds) : undefined}
    >
      {edgeLabelField}
    </SelectionRailTemplate>
  );
}
