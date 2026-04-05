import { useCallback, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import type { Location } from '@/features/content/locations/domain/model/location';
import FormSelectField from '@/ui/patterns/form/FormSelectField';
import OptionPickerField from '@/ui/patterns/form/OptionPickerField';
import type { PickerOption } from '@/ui/patterns/form/OptionPickerField';
import { parseGridCellId } from '@/shared/domain/grid/gridCellIds';
import {
  getAllowedLinkedLocationOptions,
  getAllowedObjectKindsForHostScale,
} from '@/shared/domain/locations';
import type { LocationMapObjectKindId, LocationScaleId } from '@/shared/domain/locations';

import type { LocationCellObjectDraft } from '../../../authoring/draft/locationGridDraft.types';

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

export function LocationCellAuthoringPanel({
  selectedCellId,
  hostLocationId,
  hostScale,
  hostName,
  campaignId,
  locations,
  linkedLocationByCellId,
  objectsByCellId,
  onUpdateLinkedLocation,
  onUpdateCellObjects,
}: LocationCellAuthoringPanelProps) {
  const byId = useMemo(() => buildLocationByIdMap(locations), [locations]);

  const hostForPolicy = useMemo(
    (): Pick<Location, 'id' | 'scale' | 'name' | 'source' | 'campaignId'> => ({
      id: hostLocationId ?? '__draft_location__',
      scale: hostScale as LocationScaleId,
      name: hostName ?? '',
      source: 'campaign',
      campaignId: campaignId ?? '',
    }),
    [hostLocationId, hostScale, hostName, campaignId],
  );

  const linkPickerOptions: PickerOption[] = useMemo(() => {
    const allowed = getAllowedLinkedLocationOptions(hostForPolicy, locations, {
      campaignId,
      excludeLocationId: hostLocationId,
    }) as Location[];
    return allowed.map((loc) => ({
      value: loc.id,
      label: `${loc.name} (${loc.scale})`,
      description: formatAncestryDescription(loc, byId),
      keywords: [loc.name, loc.scale],
    }));
  }, [hostForPolicy, locations, campaignId, hostLocationId, byId]);

  const cellId = selectedCellId;
  const parsed = cellId ? parseGridCellId(cellId) : null;
  const linkedId = cellId ? linkedLocationByCellId[cellId] : undefined;
  const linkedLoc = linkedId ? byId.get(linkedId) : undefined;
  const cellObjects = cellId ? objectsByCellId[cellId] ?? [] : [];

  const allowedObjectKinds = useMemo(
    () => getAllowedObjectKindsForHostScale(hostScale),
    [hostScale],
  );

  const handleLinkedChange = useCallback(
    (next: string[]) => {
      if (!cellId) return;
      const v = next[0];
      onUpdateLinkedLocation(cellId, v);
    },
    [cellId, onUpdateLinkedLocation],
  );

  const handleAddObject = useCallback(
    (kind: LocationMapObjectKindId) => {
      if (!cellId) return;
      const next: LocationCellObjectDraft = {
        id: crypto.randomUUID(),
        kind,
        label: '',
      };
      onUpdateCellObjects(cellId, [...cellObjects, next]);
    },
    [cellId, cellObjects, onUpdateCellObjects],
  );

  const handleRemoveObject = useCallback(
    (objectId: string) => {
      if (!cellId) return;
      onUpdateCellObjects(
        cellId,
        cellObjects.filter((o) => o.id !== objectId),
      );
    },
    [cellId, cellObjects, onUpdateCellObjects],
  );

  const handleLabelChange = useCallback(
    (objectId: string, label: string) => {
      if (!cellId) return;
      onUpdateCellObjects(
        cellId,
        cellObjects.map((o) => (o.id === objectId ? { ...o, label } : o)),
      );
    },
    [cellId, cellObjects, onUpdateCellObjects],
  );

  const kindsAvailableToAdd = useMemo(
    () => [...allowedObjectKinds],
    [allowedObjectKinds],
  );

  const [addObjectSelectKey, setAddObjectSelectKey] = useState(0);

  const addObjectForm = useForm<{ addObjectKind: string }>({
    defaultValues: { addObjectKind: '' },
  });

  const addObjectKindOptions = useMemo(
    () => kindsAvailableToAdd.map((k) => ({ value: k, label: k })),
    [kindsAvailableToAdd],
  );

  if (selectedCellId == null) {
    return (
      <Typography variant="body2" color="text.secondary">
        Select a cell on the map to link a location or add cell objects.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="subtitle2" fontWeight={600}>
          Cell
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
            {selectedCellId}
          </Box>
          {parsed ? (
            <>
              {' · '}
              x {parsed.x}, y {parsed.y}
            </>
          ) : null}
        </Typography>
        {(hostName || hostScale) && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {hostName ? `${hostName} · ` : ''}
            {hostScale} map
          </Typography>
        )}
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {linkedLoc
          ? `Linked: ${linkedLoc.name}`
          : 'No location linked'}
        {cellObjects.length > 0
          ? ` · ${cellObjects.length} object${cellObjects.length === 1 ? '' : 's'}`
          : ''}
      </Typography>

      <Box>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          Linked location
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Choose an existing location allowed for this map. One link per cell.
        </Typography>
        <OptionPickerField
          label="Link location"
          placeholder="Search locations…"
          options={linkPickerOptions}
          value={linkedId ? [linkedId] : []}
          onChange={handleLinkedChange}
          maxItems={1}
          emptyMessage="No locations can be linked from this map (policy)."
          renderSelectedAs="card"
        />
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          Cell objects
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Simple markers and props allowed on this scale.
        </Typography>

        {cellObjects.length > 0 ? (
          <List dense disablePadding sx={{ mb: 1 }}>
            {cellObjects.map((obj) => (
              <ListItem
                key={obj.id}
                disableGutters
                sx={{
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: 0.75,
                  py: 1,
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Chip size="small" label={obj.kind} variant="outlined" />
                  <Box sx={{ flex: 1 }} />
                  <Button
                    size="small"
                    onClick={() => handleRemoveObject(obj.id)}
                    aria-label={`Remove ${obj.kind}`}
                  >
                    Remove
                  </Button>
                </Stack>
                <TextField
                  size="small"
                  fullWidth
                  label="Label (optional)"
                  value={obj.label ?? ''}
                  onChange={(e) => handleLabelChange(obj.id, e.target.value)}
                  placeholder="Short note"
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            No objects yet.
          </Typography>
        )}

        <Box sx={{ maxWidth: '100%' }}>
          <FormProvider {...addObjectForm}>
            <FormSelectField
              key={addObjectSelectKey}
              name="addObjectKind"
              label="Add object"
              options={addObjectKindOptions}
              placeholder="Choose kind…"
              size="small"
              onAfterChange={(v) => {
                if (!v) return;
                handleAddObject(v as LocationMapObjectKindId);
                addObjectForm.reset({ addObjectKind: '' });
                setAddObjectSelectKey((x) => x + 1);
              }}
            />
          </FormProvider>
        </Box>
      </Box>
    </Stack>
  );
}
