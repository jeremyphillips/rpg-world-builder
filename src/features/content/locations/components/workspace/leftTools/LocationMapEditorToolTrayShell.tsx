import type { ReactNode } from 'react';
import Box from '@mui/material/Box';

import { locationEditorWorkspaceUiTokens } from '@/features/content/locations/domain/presentation/map/locationEditorWorkspaceUiTokens';

type LocationMapEditorToolTrayShellProps = {
  children: ReactNode;
};

/**
 * Fixed-width column beside the map toolbar for paint/draw palettes. Positioned by the map column overlay.
 */
export function LocationMapEditorToolTrayShell({ children }: LocationMapEditorToolTrayShellProps) {
  const { mapToolbarWidthPx, mapToolTrayWidthPx } = locationEditorWorkspaceUiTokens;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: mapToolbarWidthPx,
        zIndex: 1,
        width: mapToolTrayWidthPx,
        minWidth: mapToolTrayWidthPx,
        maxWidth: mapToolTrayWidthPx,
        boxSizing: 'border-box',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {children}
    </Box>
  );
}
