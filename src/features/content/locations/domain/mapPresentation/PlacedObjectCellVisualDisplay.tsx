/**
 * Renders a placed object in a grid cell: MUI icon when {@link PlacedObjectCellVisual.showIcon},
 * otherwise a large centered fallback letter (no corner mini-labels).
 */
import { createElement } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { LocationMapUiResolvedStyles } from './locationMapUiStyles';
import type { PlacedObjectCellVisual } from './resolvePlacedObjectCellVisual';
import { getLocationMapGlyphIconByName } from './locationMapIconNameMap';

export type PlacedObjectCellVisualDisplayProps = {
  visual: PlacedObjectCellVisual;
  variant: 'tactical' | 'overlay';
  mapUi: LocationMapUiResolvedStyles;
};

export function PlacedObjectCellVisualDisplay({ visual, variant, mapUi }: PlacedObjectCellVisualDisplayProps) {
  const st = mapUi.placedObject[variant];

  if (visual.showIcon && visual.iconName) {
    const IconComp = getLocationMapGlyphIconByName(visual.iconName);
    return createElement(IconComp, {
      sx: {
        fontSize: st.icon.fontSizePx,
        width: st.icon.widthPx,
        height: st.icon.heightPx,
        display: st.icon.display,
        color: st.icon.color,
      },
      'aria-hidden': true,
    });
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
