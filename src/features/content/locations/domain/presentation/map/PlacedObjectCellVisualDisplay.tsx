/**
 * Renders a placed object in a grid cell: map raster image when available, else large fallback letter.
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { LocationMapUiResolvedStyles } from './locationMapUiStyles';
import { PLACED_OBJECT_MAP_SPRITE_OBJECT_FIT } from './placedObjectMapSprite.constants';
import type { PlacedObjectCellVisual } from './resolvePlacedObjectCellVisual';

export type PlacedObjectCellVisualDisplayProps = {
  visual: PlacedObjectCellVisual;
  variant: 'tactical' | 'overlay';
  mapUi: LocationMapUiResolvedStyles;
};

export function PlacedObjectCellVisualDisplay({ visual, variant, mapUi }: PlacedObjectCellVisualDisplayProps) {
  const st = mapUi.placedObject[variant];
  const ax = visual.layoutAnchorOffsetXPx ?? 0;
  const ay = visual.layoutAnchorOffsetYPx ?? 0;
  const anchorTransform = ax !== 0 || ay !== 0 ? `translate(${ax}px, ${ay}px)` : undefined;

  if (visual.showMapRaster && visual.mapImageUrl) {
    const w = visual.layoutWidthPx ?? st.icon.widthPx;
    const h = visual.layoutHeightPx ?? st.icon.heightPx;
    const hasFootprintLayoutPx =
      visual.layoutWidthPx != null && visual.layoutHeightPx != null;
    return (
      <Box
        component="img"
        src={visual.mapImageUrl}
        alt=""
        sx={{
          width: w,
          height: h,
          objectFit: PLACED_OBJECT_MAP_SPRITE_OBJECT_FIT,
          display: st.icon.display,
          userSelect: 'none',
          pointerEvents: 'none',
          ...(hasFootprintLayoutPx ? { flexShrink: 0 } : {}),
          ...(anchorTransform ? { transform: anchorTransform } : {}),
        }}
        aria-hidden
      />
    );
  }

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        lineHeight: 0,
        ...(anchorTransform ? { transform: anchorTransform } : {}),
      }}
    >
      <Typography
        component="span"
        variant={st.fallback.typographyVariant}
        sx={{
          fontWeight: st.fallback.fontWeight,
          lineHeight: st.fallback.lineHeight,
          color: st.fallback.color,
          userSelect: st.fallback.userSelect,
          fontSize: st.fallback.fontSizeRem,
        }}
      >
        {visual.fallbackLetter}
      </Typography>
    </Box>
  );
}

/** Centers the visual within a cell-sized box (tactical grid). */
export function PlacedObjectCellVisualCentered(props: PlacedObjectCellVisualDisplayProps) {
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <PlacedObjectCellVisualDisplay {...props} />
    </Box>
  );
}
