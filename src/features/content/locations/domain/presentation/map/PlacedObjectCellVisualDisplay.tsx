/**
 * Renders a placed object in a grid cell: map raster image when available, else large fallback letter.
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { LocationMapUiResolvedStyles } from './locationMapUiStyles';
import type { PlacedObjectCellVisual } from './resolvePlacedObjectCellVisual';

export type PlacedObjectCellVisualDisplayProps = {
  visual: PlacedObjectCellVisual;
  variant: 'tactical' | 'overlay';
  mapUi: LocationMapUiResolvedStyles;
};

export function PlacedObjectCellVisualDisplay({ visual, variant, mapUi }: PlacedObjectCellVisualDisplayProps) {
  const st = mapUi.placedObject[variant];

  if (visual.showMapRaster && visual.mapImageUrl) {
    const w = visual.layoutWidthPx ?? st.icon.widthPx;
    const h = visual.layoutHeightPx ?? st.icon.heightPx;
    return (
      <Box
        component="img"
        src={visual.mapImageUrl}
        alt=""
        sx={{
          width: w,
          height: h,
          objectFit: 'contain',
          display: st.icon.display,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
        aria-hidden
      />
    );
  }

  return (
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
