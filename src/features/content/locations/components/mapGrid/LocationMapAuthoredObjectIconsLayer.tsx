import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

import type { LocationMapUiResolvedStyles } from '@/features/content/locations/domain/presentation/map/locationMapUiStyles';
import {
  PlacedObjectAuthoredIconRowStack,
  resolvePlacedObjectAuthoredIconRowStackMaxWidthPx,
} from '@/features/content/locations/domain/presentation/map/PlacedObjectAuthoredIconRowStack';
import { PlacedObjectCellVisualDisplay } from '@/features/content/locations/domain/presentation/map/PlacedObjectCellVisualDisplay';
import { resolvePlacedObjectCellVisualFromRenderItem } from '@/features/content/locations/domain/presentation/map/resolvePlacedObjectCellVisual';
import type { PlacedObjectGeometryLayoutContext } from '@/shared/domain/locations/map/placedObjectGeometryLayoutContext';
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
  /** When set (e.g. encounter `cellFeet` + tactical pixel cell), applies registry footprint sizing. */
  footprintLayout?: PlacedObjectGeometryLayoutContext | null;
};

/**
 * Same glyphs as {@link LocationMapAuthoredObjectIconsLayer}, but laid out in normal flow for use
 * inside a flex-centered grid cell (avoids global stacking-context issues vs tactical layers).
 */
export function LocationMapAuthoredObjectIconsCellInline({
  items,
  cellPx,
  mapUi,
  footprintLayout,
}: LocationMapAuthoredObjectIconsCellInlineProps) {
  if (items.length === 0) return null;
  const authorCellId = items[0]!.authorCellId;
  const singleVisual =
    items.length === 1
      ? resolvePlacedObjectCellVisualFromRenderItem(items[0]!, footprintLayout ?? undefined)
      : null;
  const rowMaxWidthPx = resolvePlacedObjectAuthoredIconRowStackMaxWidthPx({
    cellPx,
    multiItemRow: items.length > 1,
    singleObjectLayoutWidthPx: singleVisual?.layoutWidthPx,
  });
  return (
    <PlacedObjectAuthoredIconRowStack cellPx={cellPx} maxWidthPx={rowMaxWidthPx}>
      {items.map((o, i) => {
        const visual =
          singleVisual != null && i === 0
            ? singleVisual
            : resolvePlacedObjectCellVisualFromRenderItem(o, footprintLayout ?? undefined);
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
    </PlacedObjectAuthoredIconRowStack>
  );
}

export type LocationMapAuthoredObjectIconsLayerProps = {
  items: readonly LocationMapAuthoredObjectRenderItem[];
  cellPx: number;
  gapPx: number;
  mapUi: LocationMapUiResolvedStyles;
  footprintLayout?: PlacedObjectGeometryLayoutContext | null;
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
  footprintLayout,
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
        const singleVisual =
          cellItems.length === 1
            ? resolvePlacedObjectCellVisualFromRenderItem(cellItems[0]!, footprintLayout ?? undefined)
            : null;
        const rowMaxWidthPx = resolvePlacedObjectAuthoredIconRowStackMaxWidthPx({
          cellPx,
          multiItemRow: cellItems.length > 1,
          singleObjectLayoutWidthPx: singleVisual?.layoutWidthPx,
        });
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
            <PlacedObjectAuthoredIconRowStack cellPx={cellPx} maxWidthPx={rowMaxWidthPx}>
              {cellItems.map((o, i) => {
                const visual =
                  singleVisual != null && i === 0
                    ? singleVisual
                    : resolvePlacedObjectCellVisualFromRenderItem(o, footprintLayout ?? undefined);
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
            </PlacedObjectAuthoredIconRowStack>
          </Box>
        );
      })}
    </Box>
  );
}
