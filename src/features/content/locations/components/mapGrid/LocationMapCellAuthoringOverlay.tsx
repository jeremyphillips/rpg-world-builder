import { createElement } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';

import { getLocationMapObjectKindIcon, getLocationScaleMapIcon } from '@/features/content/locations/domain';
import type { LocationMapUiResolvedStyles } from '@/features/content/locations/domain/mapPresentation/locationMapUiStyles';
import type { Location } from '@/features/content/locations/domain/types';
import { getMapRegionColor } from '@/app/theme/mapColors';

import type { GridCell } from './GridEditor';
import type { LocationGridDraftState } from '@/features/content/locations/components/locationGridDraft.types';
import type { LocationMapSelection } from '@/features/content/locations/components/workspace/locationEditorRail.types';

type LocationMapCellAuthoringOverlayProps = {
  cell: GridCell;
  draft: LocationGridDraftState;
  selectHoverTarget: LocationMapSelection;
  isHex: boolean;
  mapUi: LocationMapUiResolvedStyles;
  locationById: Map<string, Location>;
};

export function LocationMapCellAuthoringOverlay({
  cell,
  draft,
  selectHoverTarget,
  isHex,
  mapUi,
  locationById,
}: LocationMapCellAuthoringOverlayProps) {
  const rid = draft.regionIdByCellId[cell.cellId]?.trim();
  const regionEntry = rid ? draft.regionEntries.find((r) => r.id === rid) : undefined;
  const baseColor = regionEntry ? getMapRegionColor(regionEntry.colorKey) : null;
  const regionSelected =
    rid != null &&
    draft.mapSelection.type === 'region' &&
    draft.mapSelection.regionId === rid;
  const regionHover =
    rid != null &&
    selectHoverTarget.type === 'region' &&
    selectHoverTarget.regionId === rid;
  const hexSelectedRegionOutline = isHex && regionSelected;
  const hexHoverRegionOutline = isHex && regionHover;
  const overlayFillOpacity = regionSelected
    ? mapUi.tokens.region.selectedOverlayOpacity
    : regionHover
      ? (mapUi.tokens.region.selectedOverlayOpacity + mapUi.tokens.region.overlayOpacity) / 2
      : mapUi.tokens.region.overlayOpacity;
  const overlay =
    baseColor != null ? (
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          bgcolor: alpha(baseColor, overlayFillOpacity),
          boxShadow:
            hexSelectedRegionOutline || hexHoverRegionOutline
              ? 'none'
              : `inset 0 0 0 ${
                  regionSelected
                    ? mapUi.tokens.region.selectedBorderWidthPx
                    : regionHover
                      ? mapUi.tokens.region.selectedBorderWidthPx
                      : mapUi.tokens.region.borderWidthPx
                }px ${alpha(baseColor, mapUi.tokens.region.borderOpacity)}`,
          zIndex: 0,
        }}
      />
    ) : null;

  const linkId = draft.linkedLocationByCellId[cell.cellId];
  const objs = draft.objectsByCellId[cell.cellId];
  const linked = linkId ? locationById.get(linkId) : undefined;
  const hasIcons = Boolean(linked || (objs && objs.length > 0));
  if (!overlay && !hasIcons) {
    return null;
  }
  const iconSx = {
    fontSize: 22,
    width: 22,
    height: 22,
    display: 'block' as const,
  };
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      {overlay}
      {hasIcons ? (
        <Stack
          direction="row"
          flexWrap="wrap"
          justifyContent="center"
          alignItems="center"
          gap={0.25}
          sx={{
            lineHeight: 0,
            maxWidth: '100%',
            position: 'relative',
            zIndex: 1,
            pointerEvents: 'auto',
          }}
        >
          {linked ? (
            <Box
              component="span"
              data-map-linked-cell={cell.cellId}
              sx={{ display: 'inline-flex', lineHeight: 0 }}
            >
              {createElement(getLocationScaleMapIcon(linked.scale), {
                sx: iconSx,
                color: 'action',
                'aria-hidden': true,
              })}
            </Box>
          ) : null}
          {objs?.map((o) => (
            <Box
              key={o.id}
              component="span"
              data-map-object-id={o.id}
              data-map-object-cell-id={cell.cellId}
              sx={{
                display: 'inline-flex',
                lineHeight: 0,
                outline: (theme) =>
                  selectHoverTarget.type === 'object' &&
                  selectHoverTarget.cellId === cell.cellId &&
                  selectHoverTarget.objectId === o.id
                    ? `2px solid ${theme.palette.primary.main}`
                    : 'none',
                outlineOffset: 2,
                borderRadius: 0.5,
              }}
            >
              {createElement(getLocationMapObjectKindIcon(o.kind), {
                sx: iconSx,
                color: 'action',
                'aria-hidden': true,
              })}
            </Box>
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}
