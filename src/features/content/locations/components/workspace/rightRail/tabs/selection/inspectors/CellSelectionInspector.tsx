import { useMemo } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { Location } from '@/features/content/locations/domain/model/location';
import type { LocationContentItem } from '@/features/content/locations/domain/repo/locationRepo';

import type { LocationMapCellFillSelection } from '@/shared/domain/locations';

import type { LocationCellObjectDraft } from '../../../../../authoring/draft/locationGridDraft.types';

import {
  SelectionMetadataRows,
  SelectionRailIdentityBlock,
  SelectionRailTemplate,
} from '../templates/SelectionRailTemplate';
import {
  buildCellFillSelectionRailViewModel,
  formatCellPlacementLine,
} from '../selectionRail.helpers';

function buildLocationByIdMap(locations: Location[]): Map<string, Location> {
  return new Map(locations.map((l) => [l.id, l]));
}

function formatAncestryDescription(loc: Location, byId: Map<string, Location>): string | undefined {
  const segments: string[] = [];
  let pid = loc.parentId;
  let guard = 0;
  while (pid && guard++ < 24) {
    const p = byId.get(pid);
    if (!p) break;
    segments.unshift(p.name);
    pid = p.parentId;
  }
  return segments.length ? segments.join(' → ') : undefined;
}

export type CellSelectionInspectorProps = {
  selectedCellId: string | null;
  hostLocationId?: string;
  hostScale: string;
  hostName?: string;
  campaignId?: string;
  /** Map host entry (campaign edit); used by object inspector link picker. */
  hostEditLocation?: LocationContentItem | null;
  locations: Location[];
  linkedLocationByCellId: Record<string, string | undefined>;
  objectsByCellId: Record<string, LocationCellObjectDraft[]>;
  cellFillByCellId: Record<string, LocationMapCellFillSelection | undefined>;
  onUpdateLinkedLocation: (cellId: string, locationId: string | undefined) => void;
  onUpdateCellObjects: (cellId: string, objects: LocationCellObjectDraft[]) => void;
};

/**
 * Empty-cell inspector: cell context only (coordinates, host map). Linking and cell-object editing belong on
 * placed-object selection and other tools — not the default Selection tab for a bare cell.
 */
export function CellSelectionInspector({
  selectedCellId,
  hostLocationId,
  hostScale,
  hostName,
  locations,
  cellFillByCellId,
}: CellSelectionInspectorProps) {
  const byId = useMemo(() => buildLocationByIdMap(locations), [locations]);

  const hostCaption =
    hostName || hostScale
      ? `${hostName ? `${hostName} · ` : ''}${hostScale} map`
      : undefined;

  const ancestryCaption = useMemo(() => {
    if (!hostLocationId) return undefined;
    const loc = byId.get(hostLocationId);
    if (!loc) return undefined;
    const anc = formatAncestryDescription(loc, byId);
    return anc ? `Location: ${anc}` : undefined;
  }, [byId, hostLocationId]);

  if (selectedCellId == null) {
    return (
      <Typography variant="body2" color="text.secondary">
        Select a cell on the map.
      </Typography>
    );
  }

  const cellId = selectedCellId;

  const fill = cellFillByCellId[cellId];
  if (fill) {
    const fillRail = buildCellFillSelectionRailViewModel(cellId, fill);
    const metadata =
      fillRail.metadataRows.length > 0 ? (
        <SelectionMetadataRows rows={fillRail.metadataRows} />
      ) : undefined;
    return (
      <SelectionRailTemplate
        categoryLabel={fillRail.categoryLabel}
        title={fillRail.title}
        placementLine={fillRail.placementLine}
        metadata={metadata}
      />
    );
  }

  return (
    <Stack spacing={2}>
      <SelectionRailIdentityBlock
        categoryLabel="Map"
        title="Cell"
        placementLine={formatCellPlacementLine(cellId)}
        secondaryCaption={[hostCaption, ancestryCaption].filter(Boolean).join(' · ') || undefined}
      />

      <Typography variant="body2" color="text.secondary">
        Select a placed object, path, region, or edge on the map to edit it. Use tools and the palette to add map
        content.
      </Typography>
    </Stack>
  );
}
