import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import type { LocationMapUiResolvedStyles } from '@/features/content/locations/domain/presentation/map/locationMapUiStyles';
import { PlacedObjectCellVisualDisplay } from '@/features/content/locations/domain/presentation/map/PlacedObjectCellVisualDisplay';
import { resolvePlacedObjectCellVisualFromRenderItem } from '@/features/content/locations/domain/presentation/map/resolvePlacedObjectCellVisual';
import type { LocationMapAuthoredObjectRenderItem } from '@/shared/domain/locations/map/locationMapAuthoredObjectRender.types';
import { squareCellCenterPx } from '@/shared/domain/grid/squareGridOverlayGeometry';

function groupByAuthorCellId(
  items: readonly LocationMapAuthoredObjectRenderItem[],
): Map<string, LocationMapAuthoredObjectRenderItem[]> {
  const m = new Map<string, LocationMapAuthoredObjectRenderItem[]>();
  for (const it of items) {
    const list = m.get(it.authorCellId) ?? [];
    list.push(it);
    m.set(it.authorCellId, list);
  }
  return m;
}

export type LocationMapAuthoredObjectIconsCellInlineProps = {
  /** Items for a single cell (same `combatCellId` / `authorCellId`). */
  items: readonly LocationMapAuthoredObjectRenderItem[];
  cellPx: number;
  mapUi: LocationMapUiResolvedStyles;
};

/**
 * Same glyphs as {@link LocationMapAuthoredObjectIconsLayer}, but laid out in normal flow for use
 * inside a flex-centered grid cell (avoids global stacking-context issues vs tactical layers).
 */
export function LocationMapAuthoredObjectIconsCellInline({
  items,
  cellPx,
  mapUi,
}: LocationMapAuthoredObjectIconsCellInlineProps) {
  if (items.length === 0) return null;
  const authorCellId = items[0]!.authorCellId;
  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      justifyContent="center"
      alignItems="center"
      gap={0.25}
      sx={{ lineHeight: 0, maxWidth: cellPx }}
    >
      {items.map((o) => {
        const visual = resolvePlacedObjectCellVisualFromRenderItem(o);
        return (
          <Tooltip key={o.id} title={visual.tooltip} placement="top" arrow>
            <Box
              component="span"
              data-map-object-id={o.id}
              data-map-object-cell-id={authorCellId}
              sx={{
                display: 'inline-flex',
                lineHeight: 0,
                pointerEvents: 'auto',
                cursor: 'default',
              }}
            >
              <PlacedObjectCellVisualDisplay visual={visual} variant="overlay" mapUi={mapUi} />
            </Box>
          </Tooltip>
        );
      })}
    </Stack>
  );
}

export type LocationMapAuthoredObjectIconsLayerProps = {
  items: readonly LocationMapAuthoredObjectRenderItem[];
  cellPx: number;
  gapPx: number;
  mapUi: LocationMapUiResolvedStyles;
};

/**
 * Cell-anchored authored object icons in grid-local pixels. Uses {@link squareCellCenterPx} with **author** cell ids (`x,y`).
 * Same icon/label resolution as tactical grid (`resolvePlacedObjectCellVisualFromRenderItem`).
 */
export function LocationMapAuthoredObjectIconsLayer({
  items,
  cellPx,
  gapPx,
  mapUi,
}: LocationMapAuthoredObjectIconsLayerProps) {
  if (items.length === 0) return null;
  const groups = groupByAuthorCellId(items);
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
      aria-hidden
    >
      {Array.from(groups.entries()).map(([authorCellId, cellItems]) => {
        const p = squareCellCenterPx(authorCellId, cellPx, gapPx);
        if (!p) return null;
        return (
          <Box
            key={authorCellId}
            sx={{
              position: 'absolute',
              left: p.cx,
              top: p.cy,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          >
            <Stack
              direction="row"
              flexWrap="wrap"
              justifyContent="center"
              alignItems="center"
              gap={0.25}
              sx={{ lineHeight: 0, maxWidth: cellPx }}
            >
              {cellItems.map((o) => {
                const visual = resolvePlacedObjectCellVisualFromRenderItem(o);
                return (
                  <Tooltip key={o.id} title={visual.tooltip} placement="top" arrow>
                    <Box
                      component="span"
                      data-map-object-id={o.id}
                      data-map-object-cell-id={authorCellId}
                      sx={{
                        display: 'inline-flex',
                        lineHeight: 0,
                        pointerEvents: 'auto',
                        cursor: 'default',
                      }}
                    >
                      <PlacedObjectCellVisualDisplay visual={visual} variant="overlay" mapUi={mapUi} />
                    </Box>
                  </Tooltip>
                );
              })}
            </Stack>
          </Box>
        );
      })}
    </Box>
  );
}
