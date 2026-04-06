import { useMemo } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { Location } from '@/features/content/locations/domain/model/location';

import type { LocationCellObjectDraft } from '../../../authoring/draft/locationGridDraft.types';

import { SelectionRailIdentityBlock } from '../selection/PlacedObjectRailTemplate';
import { formatCellPlacementLine } from '../selection/placedObjectRail.helpers';

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

export type LocationCellAuthoringPanelProps = {
  selectedCellId: string | null;
  hostLocationId?: string;
  hostScale: string;
  hostName?: string;
  campaignId?: string;
  locations: Location[];
  linkedLocationByCellId: Record<string, string | undefined>;
  objectsByCellId: Record<string, LocationCellObjectDraft[]>;
  onUpdateLinkedLocation: (cellId: string, locationId: string | undefined) => void;
  onUpdateCellObjects: (cellId: string, objects: LocationCellObjectDraft[]) => void;
};

/**
 * Empty-cell inspector: cell context only (coordinates, host map). Linking and cell-object editing belong on
 * placed-object selection and other tools — not the default Selection tab for a bare cell.
 */
export function LocationCellAuthoringPanel({
  selectedCellId,
  hostLocationId,
  hostScale,
  hostName,
  locations,
  linkedLocationByCellId: _linkedLocationByCellId,
  objectsByCellId: _objectsByCellId,
  campaignId: _campaignId,
  onUpdateLinkedLocation: _onUpdateLinkedLocation,
  onUpdateCellObjects: _onUpdateCellObjects,
}: LocationCellAuthoringPanelProps) {
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
